import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { selectLabel, type FilterOption } from "@/components/aviation-news/filter-options";

type FilterSelectState =
  /** Part of a form: submitted as `name`, starts at `defaultValue`. */
  | { name: string; defaultValue: string; value?: never; onValueChange?: never }
  /** Stand-alone: shows `value`, reports every change right away. */
  | { value: string; onValueChange: (value: string | null) => void; name?: never; defaultValue?: never };

type FilterSelectProps = FilterSelectState & {
  options: readonly FilterOption[];
  /** Trigger text while nothing is filtered, e.g. "Severities". */
  placeholder: string;
  triggerClassName: string;
  triggerId?: string;
};

/** One aviation-news filter as a Select, used by both the toolbar and the filter form. */
export function FilterSelect({ options, placeholder, triggerClassName, triggerId, ...state }: FilterSelectProps) {
  return (
    <Select<string> {...state}>
      <SelectTrigger id={triggerId} className={triggerClassName}>
        <SelectValue>{selectLabel(placeholder, options)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
