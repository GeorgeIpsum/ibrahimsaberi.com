"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/atoms/button";
import {
  Drawer,
  DrawerClose,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/atoms/drawer";
import { NavSwap } from "@/features/reflection";
import { navItems } from "./nav-items";

export const MobileNavMenu: React.FC = () => {
  return (
    <Drawer position="right">
      <DrawerTrigger render={<Button size="icon-xs" variant="outline" />}>
        <Menu />
      </DrawerTrigger>
      <DrawerPopup showCloseButton variant="straight">
        <DrawerHeader>
          <DrawerTitle>don't spill</DrawerTitle>
        </DrawerHeader>
        <DrawerPanel>
          <nav className="-mx-[calc(--spacing(3)-1px)] flex flex-col gap-0.5">
            {navItems.map((item) => (
              <DrawerClose
                key={item.href}
                nativeButton={false}
                render={
                  <Button
                    className="group/menu-link justify-start"
                    render={<Link href={item.href} />}
                    variant="ghost"
                  />
                }
              >
                {item.title === "reflection" ? (
                  <NavSwap className="group-hover/menu-link:text-foreground-high-contrast" />
                ) : (
                  <item.icon className="size-4 transition-colors group-hover/menu-link:text-foreground-high-contrast" />
                )}
                {item.title}
              </DrawerClose>
            ))}
          </nav>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
};
