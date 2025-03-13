import { BiCartAdd, BiPlusCircle, BiSolidCategoryAlt } from "react-icons/bi";
import { FaProductHunt, FaUser } from "react-icons/fa";
import { RiUserAddFill } from "react-icons/ri";

export const links = [
  {
    name: "Employees",
    path: "employees",
    icon: <FaUser />,
    role: ["admin"],
  },
  {
    name: "Add Employees",
    path: "employees/add",
    icon: <RiUserAddFill />,
    role: ["admin"],
  },
  {
    name: "Categories",
    path: "categories",
    icon: <BiSolidCategoryAlt />,
    role: ["admin", "employee"],
  },
  {
    name: "Add Category",
    path: "categories/add",
    icon: <BiPlusCircle />,
    role: ["admin", "employee"],
  },
  {
    name: "Products",
    path: "products",
    icon: <FaProductHunt />,
    role: ["admin", "employee"],
  },
  {
    name: "Add Products",
    path: "products/add",
    icon: <BiCartAdd />,
    role: ["admin", "employee"],
  },
];
