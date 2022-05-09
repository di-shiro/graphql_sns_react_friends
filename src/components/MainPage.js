import React from "react";
import styles from "./MainPage.module.css";
import { useHistory } from "react-router-dom";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";

const MainPage = () => {
  const history = useHistory();

  return (
    <div>
      <ExitToAppIcon
        className={styles.mainPage__out}
        onClick={() => {
          localStorage.removeItem("token");
          history.push("/");
        }}
      />
    </div>
  );
};

export default MainPage;
