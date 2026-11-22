"use client";

import Link from "next/link";
import type { MouseEvent, PointerEvent } from "react";
import { focusWithoutRing } from "./menu-dom";
import { SubmenuNode } from "./SubmenuNode";
import type { DropdownMenuItem } from "./types";

interface MenuItemsListProps {
  items: readonly DropdownMenuItem[];
  rootClose: (fromPointer: boolean) => void;
  hasNativeFocusgroup: boolean;
  hasNativeInvokers: boolean;
}

export function MenuItemsList({
  items,
  rootClose,
  hasNativeFocusgroup,
  hasNativeInvokers,
}: MenuItemsListProps) {
  const handleItemPointerMove = (event: PointerEvent<HTMLElement>) => {
    const under = document.elementFromPoint(event.clientX, event.clientY);
    if (under && !event.currentTarget.contains(under)) return;
    focusWithoutRing(event.currentTarget);
  };

  return (
    <>
      {items.map((item) => {
        if (item.type === "separator") {
          return <hr key={item.id} />;
        }

        if (item.type === "submenu") {
          return (
            <SubmenuNode
              key={item.id}
              item={item}
              hasNativeFocusgroup={hasNativeFocusgroup}
              hasNativeInvokers={hasNativeInvokers}
              renderChildren={() => (
                <MenuItemsList
                  items={item.items}
                  rootClose={rootClose}
                  hasNativeFocusgroup={hasNativeFocusgroup}
                  hasNativeInvokers={hasNativeInvokers}
                />
              )}
            />
          );
        }

        if (item.type === "checkbox") {
          return (
            <button
              key={item.id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={item.checked}
              disabled={item.disabled}
              data-checkable="true"
              className="ds-menu-item"
              onPointerMove={handleItemPointerMove}
              onKeyDown={(event) => {
                if (event.key === " ") {
                  event.preventDefault();
                  item.onCheckedChange(!item.checked);
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  item.onCheckedChange(!item.checked);
                  window.setTimeout(() => rootClose(false), 260);
                }
              }}
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                if (event.detail === 0) return;
                item.onCheckedChange(!item.checked);
                window.setTimeout(() => rootClose(true), 260);
              }}
            >
              <span>{item.label}</span>
            </button>
          );
        }

        if (item.type === "radio-group") {
          return (
            <div
              key={item.id}
              role="group"
              aria-label={item.label}
              className="flex flex-col gap-0.5"
            >
              <p className="ds-menu-group-label" aria-hidden="true">
                {item.label}
              </p>
              {item.options.map((option) => {
                const isSelected = option.value === item.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    disabled={option.disabled}
                    data-checkable="radio"
                    className="ds-menu-item"
                    onPointerMove={handleItemPointerMove}
                    onClick={(event) => {
                      item.onValueChange(option.value);
                      const fromPointer = event.detail !== 0;
                      window.setTimeout(() => rootClose(fromPointer), 260);
                    }}
                  >
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          );
        }

        if (item.type === "link") {
          if (item.external) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                role={hasNativeFocusgroup ? undefined : "menuitem"}
                aria-disabled={item.disabled ? "true" : undefined}
                className="ds-menu-item"
                onPointerMove={handleItemPointerMove}
                onClick={(event) => rootClose(event.detail !== 0)}
              >
                {item.icon ? (
                  <span className="ds-menu-slot-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                <span>{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              role={hasNativeFocusgroup ? undefined : "menuitem"}
              aria-disabled={item.disabled ? "true" : undefined}
              className="ds-menu-item"
              onPointerMove={handleItemPointerMove}
              onClick={(event) => rootClose(event.detail !== 0)}
            >
              {item.icon ? (
                <span className="ds-menu-slot-icon" aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}
              <span>{item.label}</span>
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            role={hasNativeFocusgroup ? undefined : "menuitem"}
            data-tone={item.tone === "danger" ? "danger" : undefined}
            className="ds-menu-item"
            onPointerMove={handleItemPointerMove}
            onClick={(event) => {
              item.onSelect();
              rootClose(event.detail !== 0);
            }}
          >
            {item.icon ? (
              <span className="ds-menu-slot-icon" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            <span>{item.label}</span>
            {item.shortcut ? (
              <span className="ds-menu-hint" aria-hidden="true">
                {item.shortcut}
              </span>
            ) : null}
          </button>
        );
      })}
    </>
  );
}
