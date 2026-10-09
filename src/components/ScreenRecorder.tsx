'use client';

import { useEffect } from 'react';
import {
  dismissRecordingError,
  discardRecording,
  downloadRecording,
  pauseRecording,
  resumeRecording,
  setRecordingMic,
  startRecording,
  stopRecording,
  useScreenRecorder,
  useScreenRecordingSupported,
} from '@/hooks/useScreenRecorder';
import { formatClock, formatSize } from '@/lib/recording';
import { useT } from '@/lib/i18n';

const BUTTON = 'rounded-md border px-2 py-1 text-[11px] font-mono transition-colors';
const NEUTRAL = 'border-zinc-300 text-zinc-500 hover:border-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200';

/**
 * The recording buttons of the top bar: start, with a switch for the microphone; while recording the
 * running time (which stops it) and pause. Left out where the browser cannot record the screen.
 */
export function RecordButton() {
  const t = useT();
  const supported = useScreenRecordingSupported();
  const recorder = useScreenRecorder();
  const active = recorder.phase === 'recording' || recorder.phase === 'paused';

  // The video lives only in memory: leaving the page would lose it.
  useEffect(() => {
    if (!active && !(recorder.phase === 'done' && !recorder.saved)) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [active, recorder.phase, recorder.saved]);

  if (!supported) return null;

  if (active) {
    return (
      <div className="inline-flex items-center gap-1" role="group" aria-label={t('Screen recording')} data-recorder="active">
        <button
          type="button"
          onClick={stopRecording}
          title={t('Stop the recording')}
          className={`${BUTTON} inline-flex items-center gap-1.5 border-red-500 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/30`}
        >
          <span className={`inline-block h-2 w-2 rounded-sm bg-red-500 ${recorder.phase === 'recording' ? 'animate-pulse' : ''}`} aria-hidden="true" />
          <span className="tabular-nums" data-recorder-clock>{formatClock(recorder.elapsedMs)}</span>
          <span className="sr-only">{t('stop')}</span>
        </button>
        {recorder.phase === 'recording' ? (
          <button type="button" onClick={pauseRecording} title={t('Pause the recording')} aria-label={t('pause')} className={`${BUTTON} ${NEUTRAL}`}>⏸</button>
        ) : (
          <button type="button" onClick={resumeRecording} title={t('Continue the recording')} aria-label={t('continue')} className={`${BUTTON} ${NEUTRAL}`}>▶</button>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={t('Screen recording')} data-recorder="idle">
      <button
        type="button"
        onClick={() => void startRecording()}
        disabled={recorder.phase === 'starting'}
        title={t('Record the screen and your voice. Choose this tab to record the chart or the palm drawing.')}
        className={`${BUTTON} ${NEUTRAL} inline-flex items-center gap-1.5 disabled:opacity-50`}
      >
        <span className="inline-block h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
        {t('rec')}
      </button>
      <button
        type="button"
        onClick={() => setRecordingMic(!recorder.mic)}
        aria-pressed={recorder.mic}
        aria-label={t('record the microphone')}
        title={recorder.mic ? t('The voice is recorded with the screen') : t('The screen is recorded without a voice')}
        className={`${BUTTON} ${recorder.mic ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-green-600 dark:bg-green-950/30 dark:text-green-400' : NEUTRAL}`}
      >
        {recorder.mic ? '🎙' : '🔇'}
      </button>
    </div>
  );
}

/**
 * What a recording leaves behind, as a card in the corner: the video to look at, to download or to throw away,
 * and the message when something went wrong.
 */
export function RecordingPanel() {
  const t = useT();
  const recorder = useScreenRecorder();
  const { result, error } = recorder;
  if (!result && !error) return null;

  return (
    <aside
      className="fixed bottom-4 right-4 z-[90] w-[min(22rem,calc(100vw-2rem))] space-y-2 rounded-lg border border-zinc-300 bg-white p-3 shadow-xl dark:border-zinc-600 dark:bg-zinc-900"
      aria-label={t('Screen recording')}
      data-recording-panel
    >
      {error && (
        <div className="flex items-start justify-between gap-2 text-xs font-mono text-red-600 dark:text-red-400" role="alert">
          <span>{t(error)}</span>
          <button type="button" onClick={dismissRecordingError} aria-label={t('Close')} className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">✕</button>
        </div>
      )}
      {result && (
        <>
          <video
            src={result.url}
            controls
            playsInline
            className="w-full rounded-md bg-black"
            // A browser's own video file has no length until it is played to the end; asking for the end gives the controls their length.
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              if (video.duration === Infinity) {
                video.currentTime = 1e101;
                video.addEventListener('timeupdate', () => { video.currentTime = 0; }, { once: true });
              }
            }}
          />
          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400" data-recording-info>
            {formatClock(result.durationMs)} · {formatSize(result.size)} · {result.name.split('.').pop()}
          </div>
          {result.withoutVoice && (
            <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">{t('The microphone could not be used, so the video has no voice.')}</div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadRecording}
              className="rounded-md border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-xs font-mono text-white hover:bg-emerald-600 dark:border-green-600 dark:bg-green-600"
            >
              {t('Download video')}
            </button>
            <button type="button" onClick={discardRecording} className={`${BUTTON} ${NEUTRAL} py-1.5 text-xs`}>{t('Discard')}</button>
          </div>
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {recorder.saved ? t('Saved to your downloads.') : t('The video is only on this device and is lost if you close the page before you download it.')}
          </p>
        </>
      )}
    </aside>
  );
}
