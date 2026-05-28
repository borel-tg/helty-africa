import { cn } from "../../lib/utils";
import { getLearnerAnimal } from "../../lib/avatars/getLearnerAnimal";

/**
 * Deterministic animal avatar for a learner (no photo upload required).
 *
 * @param {object} props
 * @param {string} props.userId — stable seed for animal selection
 * @param {number} [props.size=40] — width/height in px
 * @param {boolean} [props.highlight] — ring for current user
 * @param {string} [props.className]
 */
export function LearnerAvatar({ userId, size = 40, highlight = false, className }) {
  const animal = getLearnerAnimal(userId);
  const { Icon, bgClass } = animal;

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 overflow-hidden",
        bgClass,
        highlight && "ring-2 ring-primary ring-offset-2",
        className
      )}
      style={{ width: size, height: size }}
      title={animal.label}
    >
      <Icon className="w-[70%] h-[70%]" />
    </div>
  );
}
