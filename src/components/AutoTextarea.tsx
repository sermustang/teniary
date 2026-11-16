import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'

/** A textarea that grows with its content instead of scrolling inside itself. */
export function AutoTextarea({
  value,
  minRows = 2,
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string; minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])

  return <textarea ref={ref} rows={minRows} value={value} className={`field textarea ${className}`} {...rest} />
}
