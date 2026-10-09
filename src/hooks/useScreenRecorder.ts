'use client';

import { useSyncExternalStore } from 'react';
import { pickMimeType, recordingFileName } from '@/lib/recording';

// The screen recorder: the screen (a tab, a window or the whole screen, as the browser lets the person
// choose) and the microphone are recorded to one video, so a chart or a palm drawing can be explained aloud.
// Nothing leaves the device: the video is kept in memory until it is downloaded or thrown away.
// One recorder for the whole page, so the buttons in the header (a wide and a narrow one) and the panel agree.

export type RecorderPhase = 'idle' | 'starting' | 'recording' | 'paused' | 'done';

export interface RecordingResult {
  url: string;
  mime: string;
  name: string;
  size: number;
  durationMs: number;
  /** The microphone was asked for but could not be used, so the video has no voice. */
  withoutVoice: boolean;
}

export interface RecorderState {
  phase: RecorderPhase;
  /** The running time while recording, excluding pauses. */
  elapsedMs: number;
  /** Whether the microphone is recorded with the screen. */
  mic: boolean;
  result: RecordingResult | null;
  /** The video has been downloaded: closing the page loses nothing. */
  saved: boolean;
  error: string;
}

const MIC_KEY = 'screenRecorderMic';
const INITIAL: RecorderState = { phase: 'idle', elapsedMs: 0, mic: true, result: null, saved: false, error: '' };
const UNSUPPORTED: RecorderState = INITIAL;

let state: RecorderState = INITIAL;
let loaded = false;
const listeners = new Set<() => void>();

let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let streams: MediaStream[] = [];
let audioContext: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let segmentStart = 0;
let banked = 0;
let running = false;
let withoutVoice = false;

function emit(next: Partial<RecorderState>) {
  state = { ...state, ...next };
  listeners.forEach(listener => listener());
}

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    if (localStorage.getItem(MIC_KEY) === 'false') state = { ...state, mic: false };
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() {
  load();
  return state;
}

/** Whether this browser can record the screen at all: desktop browsers can, phones' browsers cannot. */
export function screenRecordingSupported(): boolean {
  return typeof navigator !== 'undefined'
    && typeof navigator.mediaDevices?.getDisplayMedia === 'function'
    && typeof MediaRecorder !== 'undefined';
}

const supportSubscribe = () => () => {};

/** True when the browser can record the screen; false on the server and on a phone. */
export function useScreenRecordingSupported(): boolean {
  return useSyncExternalStore(supportSubscribe, screenRecordingSupported, () => false);
}

function elapsedNow() {
  return banked + (running ? performance.now() - segmentStart : 0);
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

function release() {
  stopTimer();
  streams.forEach(stream => stream.getTracks().forEach(track => track.stop()));
  streams = [];
  if (audioContext) void audioContext.close().catch(() => {});
  audioContext = null;
}

function dropResult() {
  if (state.result) URL.revokeObjectURL(state.result.url);
}

async function getScreen(): Promise<MediaStream> {
  // Chrome offers "this tab" first with preferCurrentTab; other browsers ignore what they do not know.
  const wanted = {
    video: { frameRate: { ideal: 30 }, cursor: 'always' },
    audio: true,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    surfaceSwitching: 'include',
  } as DisplayMediaStreamOptions;
  try {
    return await navigator.mediaDevices.getDisplayMedia(wanted);
  } catch (error) {
    // A browser that does not take these options at all is asked with the plainest ones.
    if (error instanceof TypeError) return navigator.mediaDevices.getDisplayMedia({ video: true });
    throw error;
  }
}

/** The audio of the screen (the shared tab's own sound) and the microphone, as one track when both are there. */
function mixAudio(sources: MediaStream[]): MediaStreamTrack[] {
  const withAudio = sources.filter(source => source.getAudioTracks().length > 0);
  if (withAudio.length === 0) return [];
  if (withAudio.length === 1) return withAudio[0].getAudioTracks();
  audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  for (const source of withAudio) audioContext.createMediaStreamSource(new MediaStream(source.getAudioTracks())).connect(destination);
  return destination.stream.getAudioTracks();
}

function finish() {
  const mime = recorder?.mimeType || 'video/webm';
  const blob = new Blob(chunks, { type: mime });
  const durationMs = elapsedNow();
  chunks = [];
  recorder = null;
  release();
  emit({
    phase: 'done',
    elapsedMs: durationMs,
    saved: false,
    result: { url: URL.createObjectURL(blob), mime, name: recordingFileName(new Date(), mime), size: blob.size, durationMs, withoutVoice },
  });
}

/** Asks for the screen (and the microphone) and starts recording. */
export async function startRecording() {
  load();
  if (state.phase === 'starting' || state.phase === 'recording' || state.phase === 'paused') return;
  if (!screenRecordingSupported()) return;
  dropResult();
  emit({ phase: 'starting', result: null, error: '', elapsedMs: 0, saved: false });
  withoutVoice = false;

  let screen: MediaStream;
  try {
    screen = await getScreen();
  } catch (error) {
    // Closing the picker is not an error.
    const cancelled = error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError');
    emit({ phase: 'idle', error: cancelled ? '' : 'Recording the screen did not start.' });
    return;
  }
  streams = [screen];

  let microphone: MediaStream | null = null;
  if (state.mic) {
    try {
      microphone = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streams.push(microphone);
    } catch {
      withoutVoice = true;
    }
  }

  try {
    const tracks = [...screen.getVideoTracks(), ...mixAudio(microphone ? [microphone, screen] : [screen])];
    const mime = pickMimeType(type => MediaRecorder.isTypeSupported(type));
    const stream = new MediaStream(tracks);
    chunks = [];
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4_000_000, audioBitsPerSecond: 128_000 } : undefined);
    recorder.ondataavailable = event => { if (event.data.size > 0) chunks.push(event.data); };
    recorder.onstop = finish;
    // "Stop sharing" in the browser's own bar ends the recording too.
    screen.getVideoTracks()[0]?.addEventListener('ended', () => stopRecording());
    banked = 0;
    segmentStart = performance.now();
    running = true;
    recorder.start(1000);
    emit({ phase: 'recording', elapsedMs: 0 });
    timer = setInterval(() => emit({ elapsedMs: elapsedNow() }), 250);
  } catch {
    release();
    recorder = null;
    running = false;
    emit({ phase: 'idle', error: 'Recording the screen did not start.' });
  }
}

export function pauseRecording() {
  if (state.phase !== 'recording' || !recorder) return;
  banked = elapsedNow();
  running = false;
  recorder.pause();
  emit({ phase: 'paused', elapsedMs: banked });
}

export function resumeRecording() {
  if (state.phase !== 'paused' || !recorder) return;
  segmentStart = performance.now();
  running = true;
  recorder.resume();
  emit({ phase: 'recording' });
}

/** Ends the recording; the video appears as the result. */
export function stopRecording() {
  if (state.phase !== 'recording' && state.phase !== 'paused') return;
  banked = elapsedNow();
  running = false;
  stopTimer();
  if (recorder && recorder.state !== 'inactive') recorder.stop();
}

/** Throws the video away. */
export function discardRecording() {
  if (state.phase === 'recording' || state.phase === 'paused') return;
  dropResult();
  emit({ phase: 'idle', result: null, saved: false, error: '', elapsedMs: 0 });
}

/** Saves the video as a file, from a link that is clicked at once. */
export function downloadRecording() {
  const result = state.result;
  if (!result) return;
  const link = document.createElement('a');
  link.href = result.url;
  link.download = result.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  emit({ saved: true });
}

export function setRecordingMic(mic: boolean) {
  load();
  try { localStorage.setItem(MIC_KEY, String(mic)); } catch {}
  emit({ mic });
}

export function dismissRecordingError() {
  emit({ error: '' });
}

/** The state of the recorder, shared by every button and the panel. */
export function useScreenRecorder(): RecorderState {
  return useSyncExternalStore(subscribe, getSnapshot, () => UNSUPPORTED);
}
