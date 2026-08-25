import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand-blue text-white hover:bg-brand-blue/90",
        cta: "bg-brand-red text-white hover:bg-brand-red/90",
        outline:
          "border-border bg-card hover:bg-brand-surface hover:text-brand-navy",
        secondary:
          "bg-brand-light-blue text-brand-blue hover:bg-brand-light-blue/80",
        ghost:
          "text-muted-foreground hover:bg-brand-surface hover:text-brand-navy",
        destructive:
          "bg-brand-light-red text-brand-red hover:bg-brand-light-red/80",
        link: "text-brand-blue underline-offset-4 hover:underline",
        gold: "bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold",
      },
      size: {
        default: "h-9 px-4 gap-1.5",
        sm: "h-8 px-3 text-xs gap-1",
        lg: "h-11 px-6 text-base gap-2",
        icon: "size-9",
        "icon-sm": "size-7",
        "icon-xs": "size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };