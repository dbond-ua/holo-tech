import { AlertTriangle } from "lucide-react";

/** Shown on pages that need real data when DATABASE_URL isn't configured
 *  yet, so managers see a clear explanation instead of a confusing empty
 *  list. */
export function DbBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Базу даних не налаштовано</p>
        <p className="mt-0.5 text-amber-800">
          Дані не зберігаються — заповніть DATABASE_URL у змінних середовища (див. README проєкту), щоб панель
          почала працювати з реальними даними. До того часу списки будуть порожні, а форми — неактивні.
        </p>
      </div>
    </div>
  );
}
