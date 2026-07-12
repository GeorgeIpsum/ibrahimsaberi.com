import { WavesArrowDown } from "lucide-react";
import { Button } from "@/components/atoms/button";
import {
  Menu,
  MenuLinkItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/atoms/menu";
import { NavHeaderItem } from "./nav-header-item";
import { type NavItem, navItems } from "./nav-items";
import { NavMenuItem } from "./nav-menu-item";

export const NavMenu: React.FC = () => {
  return (
    <nav className="hidden w-full flex-1 items-center justify-end gap-4 sm:flex">
      <ul className="flex w-full items-center justify-end gap-4 text-sm">
        {navItems
          .filter((item: NavItem) => !item.mobileOnly && !item.footerItem)
          .map((item: NavItem) => (
            <li key={item.href}>
              <NavHeaderItem navItem={item} />
            </li>
          ))}
      </ul>
      <Menu>
        <MenuTrigger
          openOnHover
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="transition-all hover:text-foreground-high-contrast"
            />
          }
        >
          <WavesArrowDown aria-label="Menu Dropdown" />
        </MenuTrigger>
        <MenuPopup side="bottom" align="end">
          {navItems
            .filter(
              (item: NavItem) =>
                item.mobileOnly && !item.footerItem && item.title !== "hearth",
            )
            .map((item: NavItem) => (
              <MenuLinkItem
                key={item.href}
                closeOnClick
                render={<NavMenuItem navItem={item} />}
              />
            ))}
        </MenuPopup>
      </Menu>
    </nav>
  );
};
