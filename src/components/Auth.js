import React, { useState } from "react";
import styles from "./Auth.module.css";
import { GET_TOKEN, CREATE_USER, CREATE_PROFILE } from "../queries";
import { useMutation } from "@apollo/client";
import FlipCameraAndroidIcon from "@material-ui/icons/FlipCameraAndroid";
import { useHistory } from "react-router-dom";

const Auth = () => {
  const history = useHistory();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [getToken] = useMutation(GET_TOKEN);
  const [createUser] = useMutation(CREATE_USER);
  const [createProfile] = useMutation(CREATE_PROFILE);
  const [isLogin, setIsLogin] = useState(true);
  const login = async () => {
    try {
      const result = await getToken({
        variables: { username: username, password: password },
      });
      await localStorage.setItem("token", result.data.tokenAuth.token);
      if (!isLogin) {
        await createProfile();
      }
      history.push("/top");
    } catch (err) {
      alert(err.message);
    }
  };

  const authUser = async (e) => {
    e.preventDefault();
    if (isLogin) {
      login();
    } else {
      try {
        await createUser({
          variables: { username: username, password: password },
        });
        login(); // 新規User作成後、直ちにログインする。Formに入力した情報をuseStateで保持しているので、それを流用する。
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className={styles.auth}>
      <form onSubmit={authUser}>
        <div className={styles.auth__input}>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className={styles.auth__input}>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit">
          {isLogin ? "Login with JWT" : "Create new user"}
        </button>
        <div>
          {/* Loginモード、Registerモードの切り替え用トグルボタン */}
          <FlipCameraAndroidIcon
            className={styles.auth__toggle}
            onClick={() => setIsLogin(!isLogin)}
          />
        </div>
      </form>
    </div>
  );
};

export default Auth;
