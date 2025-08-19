import { cn, ButtonColor } from "@/styles"
import { ButtonHTMLAttributes, DetailedHTMLProps } from "react"

const buttonBaseClass =
  "h-8 w-8 flex items-center justify-center rounded cursor-pointer disabled:bg-gray-700 disabled:cursor-not-allowed"
const cyanButtonClass = "bg-cyan-600 hover:bg-cyan-500"
const redButtonClass = "bg-red-600 hover:bg-red-500"
const grayButtonClass = "bg-gray-700 hover:bg-gray-600"

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
