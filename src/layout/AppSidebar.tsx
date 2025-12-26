"use client";
import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useUserRole } from "@/hooks/useUserRole";
import { usePlan } from "@/context/PlanContext";
import { canAccessRoute } from "@/lib/permissions";
import {
  BoxCubeIcon,
  CalenderIcon,
  DollarLineIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PaperPlaneIcon,
  PieChartIcon,
  PlugInIcon,
  UserCircleIcon,
  LockIcon,
  ShootingStarIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  requiredFeature?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const dashboardItem: NavItem = {
  icon: <GridIcon />,
  name: "Dashboard",
  path: "/",
};

// Navigation items with requiredFeature for plan gating
const navGroups: NavGroup[] = [
  {
    label: "Sales & Finance",
    items: [
      { icon: <PageIcon />, name: "Quotes", path: "/quotes", requiredFeature: "quotes" },
      { icon: <PageIcon />, name: "Invoices", path: "/invoices", requiredFeature: "invoices" },
      { icon: <BoxCubeIcon />, name: "Orders", path: "/orders", requiredFeature: "orders" },
      { icon: <DollarLineIcon />, name: "Transactions", path: "/finance/transactions", requiredFeature: "transactions" },
      { icon: <DollarLineIcon />, name: "Payments", path: "/payments", requiredFeature: "paymentGateway" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { icon: <DollarLineIcon />, name: "Promotions", path: "/promotions", requiredFeature: "promotions" },
      { icon: <ListIcon />, name: "Packages", path: "/packages", requiredFeature: "packages" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { icon: <PieChartIcon />, name: "Reports", path: "/reports", requiredFeature: "analytics" },
    ],
  },
  {
    label: "CRM",
    items: [
      { icon: <GroupIcon />, name: "Customers", path: "/customers", requiredFeature: "customers" },
      { icon: <ShootingStarIcon />, name: "Agents", path: "/agents", requiredFeature: "agents" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: <CalenderIcon />, name: "Operation Board", path: "/production-board", requiredFeature: "departments" },
      { icon: <BoxCubeIcon />, name: "Products", path: "/products", requiredFeature: "products" },
      { icon: <PaperPlaneIcon />, name: "Shipments", path: "/shipments", requiredFeature: "shipments" },
    ],
  },
  {
    label: "Settings",
    items: [
      { icon: <UserCircleIcon />, name: "User Management", path: "/users", requiredFeature: "staff" },
      { icon: <PlugInIcon />, name: "Pricing Engine", path: "/settings", requiredFeature: "pricingEngine" },
      { icon: <CalenderIcon />, name: "Workflow Settings", path: "/workflow-settings", requiredFeature: "workflow" },
      { icon: <UserCircleIcon />, name: "User Profile", path: "/profile", requiredFeature: "profile" },
      { icon: <DollarLineIcon />, name: "Billing", path: "/billing" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { role, allowedRoutes } = useUserRole();
  const { features, can } = usePlan();

  // Filter based on role access (show locked plan features)
  const filteredNavGroups = useMemo(() => {
    return navGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          // Check role access only (we show locked features now)
          if (item.path) {
            return canAccessRoute(role, item.path, allowedRoutes);
          }
          return true;
        }),
      }))
      .filter(group => group.items.length > 0);
  }, [role, allowedRoutes]);

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" className="flex items-center">
          {isExpanded || isHovered || isMobileOpen ? (
            <span className="text-xl font-bold text-gray-800 dark:text-white">LinkPrintShop</span>
          ) : (
            <span className="text-xl font-bold text-gray-800 dark:text-white">LP</span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Dashboard */}
            <div className="mb-2">
              <Link
                href={dashboardItem.path || "/"}
                className={`menu-item group ${isActive(dashboardItem.path || "/") ? "menu-item-active" : "menu-item-inactive"}`}
              >
                <span className={`${isActive(dashboardItem.path || "/") ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {dashboardItem.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{dashboardItem.name}</span>
                )}
              </Link>
            </div>

            {/* Navigation Groups */}
            {filteredNavGroups.map((group) => (
              <div key={group.label} className="mb-2">
                <h2
                  className={`mb-2 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
                >
                  {isExpanded || isHovered || isMobileOpen ? group.label : <HorizontaLDots />}
                </h2>
                <ul className="flex flex-col gap-1">
                  {group.items.map((nav) => {
                    const isLocked = nav.requiredFeature && !can(nav.requiredFeature);
                    const targetPath = nav.path;

                    return (
                      <li key={nav.name}>
                        {nav.path && (
                          <Link
                            href={targetPath || "#"}
                            className={`menu-item group relative ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"} ${isLocked ? "opacity-75" : ""}`}
                            title={isLocked ? `Upgrade to unlock ${nav.name}` : nav.name}
                          >
                            <span className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                              {nav.icon}
                            </span>
                            {(isExpanded || isHovered || isMobileOpen) && (
                              <span className="menu-item-text flex items-center justify-between flex-1 min-w-0">
                                <span className="truncate">{nav.name}</span>
                                {isLocked && (
                                  <span className="ml-2 text-gray-400 shrink-0 mr-1">
                                    <LockIcon className="w-4 h-4" />
                                  </span>
                                )}
                              </span>
                            )}
                            {/* Lock dot for collapsed state */}
                            {(!isExpanded && !isHovered && !isMobileOpen && isLocked) && (
                              <span className="absolute top-2 right-2 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                              </span>
                            )}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
