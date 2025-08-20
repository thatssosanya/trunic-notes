import { cn, ButtonColor } from "@/styles"
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react"

const buttonBaseClass =
  "h-8 w-8 flex items-center justify-center rounded cursor-pointer disabled:bg-muted disabled:cursor-not-allowed"
const cyanButtonClass = "bg-accent hover:bg-accent-highlight"
const redButtonClass = "bg-danger hover:bg-danger-highlight"
const grayButtonClass = "bg-muted hover:bg-muted-highlight"

type BaseProps = Omit<
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
  "color"
>

type Props = {
  Icon: React.FC<{ size: number }>
  color: ButtonColor
}

export default function IconButton(props: BaseProps & Props) {
  const { Icon, color, className, ...rest } = props
  return (
    <button
      {...rest}
      className={cn(
        buttonBaseClass,
        color === ButtonColor.CYAN && cyanButtonClass,
        color === ButtonColor.RED && redButtonClass,
        color === ButtonColor.GRAY && grayButtonClass,
        className
      )}
    >
      <Icon size={20} />
    </button>
  )
}
