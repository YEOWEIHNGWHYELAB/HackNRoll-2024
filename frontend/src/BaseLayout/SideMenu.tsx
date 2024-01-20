import React, { useState } from "react";
import PropTypes from "prop-types";
import { NavLink, useNavigate } from "react-router-dom";

import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Collapse from "@mui/material/Collapse";
import SearchIcon from "@mui/icons-material/Search";
import TimelineIcon from '@mui/icons-material/Timeline';
import SpeedIcon from '@mui/icons-material/Speed';

import { Box } from "@mui/system";
import { GlobalStyles, useTheme } from "@mui/material";

const drawerWidth = 300;

const listItems = [
  {
    key: "lookup",
    name: "Dashboard",
    icon: <SpeedIcon />,
    children: [{ name: "Lookup", icon: <SearchIcon />, to: "/lookup" }],
  },
  {
    key: "graphView",
    name: "Graph",
    icon: <TimelineIcon />,
    children: [{ name: "Graph View", icon: <SearchIcon />, to: "/graph-view" }],
  },
];

const SidebarGlobalStyles = () => {
  const theme = useTheme();

  return (
    <GlobalStyles
      styles={{
        ".sidebar-nav-item": {
          color: "unset",
          textDecoration: "none",
        },
        ".sidebar-nav-item-active": {
          textDecoration: "none",
          color: theme.palette.primary.main,
          "& .MuiSvgIcon-root": {
            color: theme.palette.primary.main,
          },
          "& .MuiTypography-root": {
            fontWeight: 500,
            color: theme.palette.primary.main,
          },
        },
      }}
    />
  );
};

const SidebarGlobalStylesMemo = React.memo(SidebarGlobalStyles);

const NestedListItem = ({ li }: { li: any }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleItemClick = () => {
    navigate(li.to);
  };

  const handleDropdownClick = (event: any) => {
    event.stopPropagation();
    setOpen(!open);
  };

  return (
    <>
      <ListItem onClick={handleItemClick}>
        <ListItemIcon>{li.icon}</ListItemIcon>
        <ListItemText primary={li.name} />
        {open ? (
          <ExpandLess onClick={handleDropdownClick} />
        ) : (
          <ExpandMore onClick={handleDropdownClick} />
        )}
      </ListItem>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {li.children.map((child: any) => (
            <NavLink
              end={li.to === "/" ? true : false}
              className={(props) => {
                return `${
                  props.isActive
                    ? "sidebar-nav-item-active"
                    : "sidebar-nav-item"
                }`;
              }}
              to={child.to}
              key={child.name}
            >
              <ListItem
                key={child.name}
                style={{
                  paddingLeft: 32,
                  paddingRight: 16,
                  borderLeft: "3px solid transparent",
                }}
              >
                <ListItemIcon>{child.icon}</ListItemIcon>
                <ListItemText primary={child.name} />
              </ListItem>
            </NavLink>
          ))}
        </List>
      </Collapse>
    </>
  );
};

export function SideMenu(props: any) {
  const { mobileOpen, setMobileOpen } = props;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <Toolbar />
      <Divider />
      <List>
        {listItems.map((li) => {
          return <NestedListItem key={li.name} li={li} />;
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <SidebarGlobalStylesMemo />

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: "block", sm: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

SideMenu.propTypes = {
  mobileOpen: PropTypes.bool,
  setMobileOpen: PropTypes.func.isRequired,
};

export default SideMenu;
