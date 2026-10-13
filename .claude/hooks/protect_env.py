"""PreToolUse hook: .env 계열 비밀 파일 접근 차단 (.env.example 은 허용)."""
import json
import re
import sys

# .env, .env.local, .env.production 등 매칭 (process.env, os.environ, .venv 는 제외)
ENV_PATTERN = re.compile(r"(?<![\w])\.env(\.[\w-]+)?(?![\w])")
ALLOWED_SUFFIXES = {".example", ".sample", ".template"}


def find_secret_env(text: str) -> str | None:
    for m in ENV_PATTERN.finditer(text or ""):
        if m.group(1) not in ALLOWED_SUFFIXES:
            return m.group(0)
    return None


def main() -> None:
    sys.stderr.reconfigure(encoding="utf-8")  # Windows 한글 깨짐 방지
    data = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    tool = data.get("tool_name", "")
    args = data.get("tool_input", {}) or {}

    if tool in ("Bash", "PowerShell"):
        targets = [args.get("command", "")]
    elif tool == "Grep":
        targets = [args.get("path", ""), args.get("glob", "")]
    else:  # Read, Edit, Write, MultiEdit, NotebookEdit
        targets = [args.get("file_path", ""), args.get("notebook_path", "")]

    for t in targets:
        hit = find_secret_env(t)
        if hit:
            print(
                f"[보호] '{hit}' 파일은 비밀 키 보호 대상이라 접근이 차단되었습니다. "
                "키 입력은 사용자가 직접 진행하고, 변수명 확인은 .env.example 을 사용하세요.",
                file=sys.stderr,
            )
            sys.exit(2)  # exit 2 = 도구 실행 차단

    sys.exit(0)


if __name__ == "__main__":
    main()
