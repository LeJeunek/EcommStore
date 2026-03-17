import Modetoggle from "./mode-toggle";
import UserButton from "./user-button";

import { Button } from "@/components/ui/button";
import Link from "next/link";

import { EllipsisVertical, ShoppingCart } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";



const Menu = () => {
  return (
    <div className="flex justify-end gap-3">
      
      {/* Desktop Menu */}
      <nav className="hidden md:flex items-center gap-1">
        <Modetoggle />

        <Button asChild variant="ghost">
          <Link href="/cart">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Cart
          </Link>
        </Button>

        <UserButton />
      </nav>

      {/* Mobile Menu */}
      <nav className="md:hidden">
        <Sheet>
          <SheetTrigger className="flex items-center">
            <EllipsisVertical />
          </SheetTrigger>

          <SheetContent className="flex flex-col items-start gap-4">
            <SheetTitle className="text-lg font-bold">
              Menu
            </SheetTitle>

            <Modetoggle />

            <Button asChild variant="ghost">
              <Link href="/cart">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Cart
              </Link>
            </Button>

            <UserButton />

            <SheetDescription />
          </SheetContent>
        </Sheet>
      </nav>

    </div>
  );
};

export default Menu;