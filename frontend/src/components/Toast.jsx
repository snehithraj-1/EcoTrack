export default function Toast({ message, type = "success" }) {
  if (!message) return null;
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm font-bold shadow-soft ring-1 ${
        type === "error" ? "bg-rose-50 text-rose-700 ring-rose-100" : "bg-leaf-50 text-leaf-800 ring-leaf-100"
      } pointer-events-none`}
    >
      {message}
    </div>
  );
}
