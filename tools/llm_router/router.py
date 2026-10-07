"""Tehtäväpohjainen mallireititin (DeepSeek + OpenAI) LiteLLM:n päällä.

Käyttö:
    export OPENAI_API_KEY=... DEEPSEEK_API_KEY=...
    python router.py "Tiivistä tämä teksti: ..."
    python router.py --task code "Kirjoita funktio ..."
    python router.py --dry-run "Todista, että ..."   # näyttää vain valitun mallin
"""
import argparse
import re

import litellm

# Tehtävätyyppi -> (ensisijainen malli, varamalli). Vaihda mallinimet tarpeen mukaan.
ROUTES = {
    "simple": ("deepseek/deepseek-chat", "openai/gpt-4o-mini"),   # luokittelu, tiivistys, poiminta, käännös
    "code": ("deepseek/deepseek-chat", "openai/gpt-4o"),          # tavallinen koodaus
    "reasoning": ("deepseek/deepseek-reasoner", "openai/o4-mini"),  # matematiikka, vaikea päättely
    "complex": ("openai/gpt-4o", "deepseek/deepseek-chat"),       # pitkä/vaativa kirjoitus ja analyysi
}
MAX_TOKENS = {"simple": 400, "code": 1500, "reasoning": 3000, "complex": 2000}

_RULES = [
    ("reasoning", r"todista|ratkaise yhtälö|prove|step by step|päättele|puzzle|proof"),
    ("code", r"```|def |function|class |bug|virhe|koodi|funktio|refaktor|sql|typescript|python|regex"),
    ("simple", r"tiivistä|summar|käännä|translate|luokittele|classify|poimi|extract|korjaa kielioppi|otsikko"),
]


def classify(prompt: str) -> str:
    """Halpa sääntöpohjainen luokittelu (ei kuluta tokeneita)."""
    low = prompt.lower()
    for task, pattern in _RULES:
        if re.search(pattern, low):
            return task
    return "complex" if len(prompt) > 4000 else "simple"


def ask(prompt: str, task: str | None = None, system: str | None = None) -> dict:
    task = task or classify(prompt)
    primary, fallback = ROUTES[task]
    messages = ([{"role": "system", "content": system}] if system else []) + [
        {"role": "user", "content": prompt}
    ]
    last_err = None
    for model in (primary, fallback):
        try:
            resp = litellm.completion(model=model, messages=messages, max_tokens=MAX_TOKENS[task])
            return {
                "task": task,
                "model": model,
                "text": resp.choices[0].message.content,
                "tokens": resp.usage.total_tokens,
                "cost_usd": litellm.completion_cost(completion_response=resp),
            }
        except Exception as e:  # rate limit, avain puuttuu, palvelu alas -> kokeile varamallia
            last_err = e
    raise RuntimeError(f"Kaikki mallit epäonnistuivat: {last_err}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("prompt")
    ap.add_argument("--task", choices=ROUTES)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if a.dry_run:
        t = a.task or classify(a.prompt)
        print(f"task={t} primary={ROUTES[t][0]} fallback={ROUTES[t][1]}")
    else:
        r = ask(a.prompt, a.task)
        print(r["text"])
        print(f"\n[{r['task']} -> {r['model']}, {r['tokens']} tokenia, ${r['cost_usd']:.5f}]")
