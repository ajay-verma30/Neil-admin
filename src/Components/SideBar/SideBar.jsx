import React, { useState, useEffect, useContext } from "react";
import { Collapse } from "react-bootstrap"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faUsers,
  faUser,
  faUserFriends,
  faBox,
  faCubes,
  faHelicopterSymbol,
  faChevronDown,
  faBuildingUser,
  faBoxOpen,
  faList,
  faFolderTree,
  faTruckFast,  
} from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation } from "react-router-dom";
import "./SideBar.css";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext"

const Sidebar = () => {
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState(null);
  const {org_id} = useParams();
  const {user} = useContext(AuthContext);
  
  const effectiveOrgId = org_id || user?.org_id;

  let menuItems = [];

  if(user?.role === "Super Admin"){
    menuItems = [
    {
      title: "Dashboard",
      icon: faTachometerAlt,
      path: `/admin/dashboard`,
    },
    {
        title: "Organizations",
        icon: faBuildingUser,
        path: "/admin/organizations",
      },
    {
      title: "Users & Groups",
      icon: faUsers,
      children: [
        { title: "Users", icon: faUser, path: `/admin/users` },
        { title: "Groups", icon: faUserFriends, path: `/admin/groups` }
      ],
    },
    {
      title: "Products & Categories",
      icon: faCubes,
      children: [
        { title: "Products", icon: faBox, path: `/admin/products` },
        { title: "Sub-Categories", icon: faFolderTree, path: `/admin/sub-categories` },
        { title: "Logos", icon: faHelicopterSymbol, path: `/admin/logos` },
      ],
    },
    {
        title: "Orders",
        icon: faTruckFast,
        path: "/admin/orders",
      },
]
}else if (user?.role === "Admin" || user?.role === "Manager"){
menuItems = [
    {
      title: "Dashboard",
      icon: faTachometerAlt,
      path: `/${effectiveOrgId}/dashboard`,
    },
    {
      title: "Users & Groups",
      icon: faUsers,
      children: [
        { title: "Users", icon: faUser, path: `/${effectiveOrgId}/users` },
        { title: "Groups", icon: faUserFriends, path: `/${effectiveOrgId}/groups` }
      ],
    },
    {
      title: "My Organization",
      icon: faBuildingUser,
      children: [
        { title: "Organization Details", icon: faList, path: `/${effectiveOrgId}/organization_details`},
        { title: "Our Products", icon: faBoxOpen, path: `/${effectiveOrgId}/products`},
        { title: "Sub-Categories", icon: faFolderTree, path: `/${effectiveOrgId}/sub-categories` },
        { title: "Logos", icon: faHelicopterSymbol, path: `/${effectiveOrgId}/logos`},
      ],
    },{
        title: "Orders",
        icon: faTruckFast,
        path: `/${effectiveOrgId}/org_orders`,
      }
  ]
}else{
  menuItems = [
      { title: "Dashboard", icon: faTachometerAlt, path: `/${effectiveOrgId}` },
      { title: "Products", icon: faBox, path: `/${effectiveOrgId}/products` },
      { title: "Orders", icon: faBoxOpen, path: `/${effectiveOrgId}/orders` },
    ]
}


  // menuItems = [
  //   {
  //     title: "Dashboard",
  //     icon: faTachometerAlt,
  //     path: `/${org_id}`,
  //   },
  //   {
  //     title: "Users & Groups",
  //     icon: faUsers,
  //     children: [
  //       { title: "Users", icon: faUser, path: `/${org_id}/users` },
  //       { title: "Groups", icon: faUserFriends, path: `/${org_id}/groups` }
  //     ],
  //   },
  //   {
  //     title: "Products & Categories",
  //     icon: faCubes,
  //     children: [
  //       { title: "Products", icon: faBox, path: `/${org_id}/products` },
  //       { title: "Sub-Categories", icon: faFolderTree, path: `/${org_id}/sub-categories` },
  //       { title: "Logos", icon: faHelicopterSymbol, path: `/${org_id}/logos` },
  //     ],
  //   },
  //   {
  //     title: "Organizations",
  //     icon: faBuildingUser,
  //     children: [
  //       { title: "Details", icon: faList, path: `/${org_id}/products` },
  //       { title: "Our Products", icon: faBoxOpen, path: `/${org_id}/sub-categories` },
  //       { title: "Logos", icon: faHelicopterSymbol, path: `/${org_id}/logos` },
  //     ],
  //   },
  // ];

  const isActive = (path) => location.pathname === path;

  const findOpenGroupIndex = (pathname) => {
    for (let i = 0; i < menuItems.length; i++) {
      if (menuItems[i].children) {
        const isChildActive = menuItems[i].children.some(
          (child) => child.path === pathname
        );
        if (isChildActive) {
          return i;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const parentIndex = findOpenGroupIndex(location.pathname);
    if (parentIndex !== null && openGroup !== parentIndex) {
      setOpenGroup(parentIndex);
    }
  }, [location.pathname]);

  const handleMenuClick = (index) => {
    setOpenGroup(openGroup === index ? null : index);
  };

  const ParentLink = ({ item, index }) => (
    <div
      className={`sidebar-link ${openGroup === index ? "active" : ""}`}
      onClick={() => handleMenuClick(index)}
      style={{ cursor: "pointer", justifyContent: "space-between" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
        <span>{item.title}</span>
      </div>
      <FontAwesomeIcon
        icon={faChevronDown}
        className={`dropdown-arrow ${openGroup === index ? "rotated" : ""}`} 
      />
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h4>{user?.role === "Super Admin" ? "Super Admin Portal" : "Organization Portal"}</h4>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, i) =>
          !item.children ? (
            <Link
              key={i}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
              <span>{item.title}</span>
            </Link>
          ) : (
            <div key={i} className="sidebar-section">
              <ParentLink item={item} index={i} />
              <Collapse in={openGroup === i}>
                <div className="sidebar-submenu">
                  {item.children.map((sub, j) => (
                    <Link
                      key={j}
                      to={sub.path}
                      className={`submenu-link ${
                        isActive(sub.path) ? "active" : ""
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={sub.icon}
                        className="submenu-icon"
                      />
                      <span>{sub.title}</span>
                    </Link>
                  ))}
                </div>
              </Collapse>
            </div>
          )
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
