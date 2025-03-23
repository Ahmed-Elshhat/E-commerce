import { NavLink } from "react-router-dom";
import { useMenu } from "../../../context/MenuContext";
import { useWindow } from "../../../context/windowContext";
import { useAppSelector } from "../../../Redux/app/hooks";
import SidebarLinks from "../NavLink";
import "./SideBar.scss";
import { IoMenu } from "react-icons/io5";

function SideBar() {
  const { data } = useAppSelector((state) => state.user);
  const links = SidebarLinks();
  const menu = useMenu();
  const windowSize = useWindow();
  const isOpen = menu?.isOpen;

  const isLargeScreen = windowSize?.windowSize && windowSize.windowSize > 839;
  const isSmallScreen = windowSize?.windowSize && windowSize.windowSize < 839;

  return (
    <div
      className="sidebar"
      style={{
        width: isOpen && isLargeScreen ? "230px" : "60px",
      }}
    >
      <div className="menu">
        <button onClick={() => menu?.setIsOpen(!isOpen)}>
          <IoMenu />
        </button>
      </div>
      <div className="links">
        {links.map(
          (link, key) =>
            link.role.includes(data ? data.role : "") && (
              <NavLink
                key={key}
                to={link.path}
                title={link.name}
                className="link"
                style={{
                  minHeight: isOpen ? "fit-content" : "38px",
                  justifyContent:
                    isOpen && isLargeScreen ? "flex-start" : "center",
                }}
                onClick={() => isSmallScreen && menu?.setIsOpen(false)}
              >
                {link.icon}
                <p
                  className="title"
                  style={{
                    display: isOpen && isLargeScreen ? "block" : "none",
                  }}
                >
                  {link.name}
                </p>
              </NavLink>
            )
        )}
      </div>
    </div>
  );
}

export default SideBar;
