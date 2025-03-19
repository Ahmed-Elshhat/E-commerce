import { useTranslation } from "react-i18next";
import { BiCartAdd, BiPlusCircle, BiSolidCategoryAlt } from "react-icons/bi";
import { FaProductHunt, FaUser } from "react-icons/fa";
import { IoMdHome } from "react-icons/io";
import { RiCoupon3Fill, RiUserAddFill } from "react-icons/ri";
import { useAppSelector } from "../../Redux/app/hooks";
import { BsShop } from "react-icons/bs";
import { MdAddBusiness, MdOutlineAddBox } from "react-icons/md";

const SidebarLinks = () => {
  const { lang } = useAppSelector((state) => state.language);
  const { t } = useTranslation();

  const links = [
    {
      name: t("sidebar.home"),
      path: "/",
      icon: <IoMdHome />,
      role: ["admin", "employee"],
    },
    {
      name: t("sidebar.employees"),
      path: `/${lang}/dashboard/employees`,
      icon: <FaUser />,
      role: ["admin"],
    },
    {
      name: t("sidebar.addEmployee"),
      path: `/${lang}/dashboard/employees/add`,
      icon: <RiUserAddFill />,
      role: ["admin"],
    },
    {
      name: t("sidebar.categories"),
      path: `/${lang}/dashboard/categories`,
      icon: <BiSolidCategoryAlt />,
      role: ["admin", "employee"],
    },
    {
      name: t("sidebar.addCategory"),
      path: `/${lang}/dashboard/categories/add`,
      icon: <BiPlusCircle />,
      role: ["admin", "employee"],
    },
    {
      name: t("sidebar.brands"),
      path: `/${lang}/dashboard/brands`,
      icon: <BsShop />,
      role: ["admin", "employee"],
    },
    {
      name: t("sidebar.addBrand"),
      path: `/${lang}/dashboard/brands/add`,
      icon: <MdAddBusiness size={26} />,
      role: ["admin", "employee"],
    },
    {
      name: t("sidebar.products"),
      path: `/${lang}/dashboard/products`,
      icon: <FaProductHunt />,
      role: ["admin", "employee"],
    },
    {
      name: t("sidebar.addProduct"),
      path: `/${lang}/dashboard/products/add`,
      icon: <BiCartAdd />,
      role: ["admin", "employee"],
    },
    {
      name: t("sidebar.coupons"),
      path: `/${lang}/dashboard/coupons`,
      icon: <RiCoupon3Fill />,
      role: ["admin", "employee"],
    },
    {
      name: t("sidebar.addCoupon"),
      path: `/${lang}/dashboard/coupons/add`,
      icon: <MdOutlineAddBox />,
      role: ["admin", "employee"],
    },
  ];

  return links;
};

export default SidebarLinks;
