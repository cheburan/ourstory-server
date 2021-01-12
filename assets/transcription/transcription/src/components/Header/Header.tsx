import { Container, Divider } from "@material-ui/core";
import React from "react";

import useStyles from "./HeaderStyles";
import Logo from "../../assets/images/logo_web.svg";

type HeaderProps = {
  title: string
}

const Header: React.FC<HeaderProps> = ({ children, title }) => {
  const classes = useStyles();

  return (
    <>
      <Container>
        <div className={classes.titleRow}>
          <div className={classes.logoContainer}>
            <img src={Logo} alt="logo" width="120px" height="36px" />
            <span className={classes.buildVersion}>TITAN</span>
          </div>
          <div className={classes.titleContainer}>
            <div className={classes.titleWrapper}>{title}</div>
          </div>
        </div>
        <Divider />
      </Container>
      {children}
    </>
  );
};

export default Header;
