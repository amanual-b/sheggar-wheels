import Link from "next/link";

export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Sheggar Wheels home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.svg" alt="" width="52" height="32" />
      <span>
        Sheggar <b>Wheels</b>
      </span>
    </Link>
  );
}
