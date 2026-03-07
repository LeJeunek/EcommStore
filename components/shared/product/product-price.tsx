import { cn } from "@/lib/utils";

const ProductPrice = ({
  value,
  className,
}: {
  // Acceptance of string | number helps with Prisma Decimal types
  value: number | string; 
  className?: string;
}) => {
  // 1. Ensure we have a valid number
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // 2. Handle cases where value might be missing
  if (isNaN(numericValue)) return null;

  const stringValue = numericValue.toFixed(2);
  const [intValue, floatValue] = stringValue.split(".");

  return (
    <div className={cn("text-2xl flex items-start", className)}>
      <span className="text-xs align-super mt-1">$</span>
      <span className="font-bold">{intValue}</span>
      <span className="text-xs align-super mt-1">.{floatValue}</span>
    </div>
  );
};

export default ProductPrice;