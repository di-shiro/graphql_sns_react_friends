import React, { useEffect, useState } from "react";
import styles from "./MainPage.module.css";
import { useHistory } from "react-router-dom";
import SendIcon from "@material-ui/icons/Send";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import { useQuery } from "@apollo/react-hooks";
import { useMutation } from "@apollo/client";
import { useLazyQuery } from "@apollo/client";
import {
  GET_MYPROFILE,
  GET_PROFILES,
  GET_MESSAGES,
  UPDATE_FRIENDS,
  UPDATE_REQUESTS,
  CREATE_MESSAGE,
} from "../queries";
import {
  Grid,
  Modal,
  makeStyles,
  TextField,
  IconButton,
} from "@material-ui/core";

// * モーダルの表示位置を画面の中央にする設定
const getModalStyle = () => {
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -%{left}%)`,
  };
};
// モーダルの幅や枠の影をつける設定
const useStyles = makeStyles((theme) => ({
  modal: {
    outline: "none",
    position: "absolute",
    width: 250,
    borderRadius: 3,
    backgroundColor: "white",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(3),
  },
}));

const MainPage = () => {
  const classes = useStyles(); // 上に作成したuseStylesを適用させるために
  const history = useHistory();
  const [dm, setDm] = useState("");
  const [openModal, setOpenModal] = useState(false); // DMのモーダルの表示・非表示を制御するState
  const [selectedReceiver, setSelectedReceiver] = useState(""); // DMを送付する宛先UserのIDを保持するState

  const { data: dataMyProfile, error: errorMyProfile } = useQuery(
    GET_MYPROFILE, //* ログインUserのProfile
    {
      fetchPolicy: "cache-and-network",
    }
  );
  const { data: dataProfiles, error: errorProfiles } = useQuery(
    GET_PROFILES, //* 全UserのProfile
    { fetchPolicy: "cache-and-network" }
  );
  const [getDMs, { data: dataMsgs }] = useLazyQuery(
    GET_MESSAGES, //* ログインUser宛に届いたDMの取得
    {
      fetchPolicy: "cache-and-network",
    }
  );
  const [updateFriends] = useMutation(UPDATE_FRIENDS);
  const [updateRequests] = useMutation(UPDATE_REQUESTS);
  const [createMessage] = useMutation(CREATE_MESSAGE); // DM送信用の関数

  // ログインUserのFriendsのIDを配列に格納
  const myFriends = dataMyProfile?.profile.friends.edges.map(
    ({ node }) => node.id
  );
  // ログインUserがFriendsRequest(申請)しているUserのID一覧
  const myfriendRequests = dataMyProfile?.profile.friendRequests.edges.map(
    ({ node }) => node.id
  );

  //* FriendRequestの承認ボタンを押したときの処理: 引数としてログインUserのfriendRequestにある相手Userオブジェクトを受け取る。
  const approveRequest = async (node) => {
    //* ログインUserのFriendsに、承認Userを追加。
    await updateFriends({
      variables: {
        id: dataMyProfile.profile.id, //    ログインUserのID
        friends: [...myFriends, node.id],
      },
    });
    //* friendRequestに申請したUserのFriendsリストにも、承認Userを追加する。
    await updateFriends({
      variables: {
        id: node.profile.id, //             friendRequestに申請したUserのUserのID
        friends: [
          ...node.profilesFriends.edges.map(({ node }) => node.userProf.id),
          dataMyProfile.profile.userProf.id,
        ],
      },
    });
    //* ログインUserのfriendRequestから、当該Userを除去する。
    await updateRequests({
      variables: {
        id: dataMyProfile.profile.id,
        friendRequests: myfriendRequests.filter(
          (friendRequestId) => friendRequestId !== node.id
        ),
      },
    });
  };

  // * 新規DM作成する関数
  const createDM = async () => {
    await createMessage({
      variables: {
        message: dm, // Userがタイピングして入力したDMの文章
        receiver: selectedReceiver, // 宛先UserのID
      },
    });
    // DMを送信し終えた後の初期化処理
    setDm(""); // DM文章の初期化
    setSelectedReceiver(""); // 宛先UserのID
    setOpenModal(false); // DMモーダルを閉じる
  };

  // * ログインUserが存在する時にuseEffectでgetDMs を実行する
  useEffect(() => {
    if (dataMyProfile?.profile.userProf.id) {
      getDMs({ variables: { receiver: dataMyProfile?.profile.userProf.id } });
      // getDMsはApollo client のキャッシュの内容を変更する処理に関わるので、useEffectの第2引数に追加
    }
  }, [dataMyProfile?.profile.userProf.id, getDMs]);

  return (
    <div className={styles.mainPage__root}>
      {(errorMyProfile || errorProfiles) && (
        <h3>
          {errorProfiles?.message}/{errorMyProfile?.message}
        </h3>
      )}
      {/* DM入力用のモーダル */}
      <Modal
        open={openModal}
        onClose={
          // モーダルの枠外をクリックした時に閉じる
          () => setOpenModal(false)
        }
      >
        <div style={getModalStyle()} className={classes.modal}>
          <div className={styles.mainPage__modal}>
            <TextField
              InputLabelProps={{ shrink: true }}
              label="dm"
              type="text"
              value={dm}
              onChange={(e) => {
                setDm(e.target.value);
              }}
            />
            <IconButton onClick={() => createDM()}>
              <SendIcon />
            </IconButton>
          </div>
        </div>
      </Modal>
      <Grid container>
        <Grid item xs>
          {dataMyProfile?.profile.userProf.username}
        </Grid>
        <Grid item xs>
          <span className={styles.mainPage__title}>Friends system </span>
        </Grid>
        <Grid item xs>
          <ExitToAppIcon
            className={styles.mainPage__out}
            onClick={() => {
              localStorage.removeItem("token");
              history.push("/");
            }}
          />
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={3}>
          <h3>My friends</h3>
          <ul className={styles.mainPage__list}>
            {dataMyProfile?.profile.friends.edges.map(({ node }) => (
              <li className={styles.mainPage__item} key={node.id}>
                {node.username}
                <button
                  onClick={() => {
                    setSelectedReceiver(node.id); // ボタンをクリックした時に実行する動作として、DM宛先UserのIDをStateに設定する。
                    setOpenModal(true);
                  }}
                >
                  dm send
                </button>
              </li>
            ))}
          </ul>
        </Grid>
        <Grid item xs={3}>
          <h3>Profile list</h3>
          <ul className={styles.mainPage__list}>
            {
              // 全UserのUserNameを表示する(ログインUserを除く)
              dataProfiles?.allProfiles.edges.map(
                ({ node }) =>
                  node.id !== dataMyProfile?.profile.id && (
                    <li className={styles.mainPage__item} key={node.id}>
                      {node.userProf.username}
                      <button
                        disabled={
                          //* ボタンの表示・非表示を切り替え
                          myFriends?.includes(node.userProf.id) | //*         既にログインUserのFriendsである場合
                          myfriendRequests?.includes(node.userProf.id) | //* 既にログインUserがFriendRequestを申請済の場合
                          node.friendRequests.edges
                            .map(({ node }) => node.id)
                            .includes(dataMyProfile?.profile.userProf.id) //* 既に相手UserがFriendRequestを申請済の場合
                        }
                        onClick={async () => {
                          //* 相手UserのfriendRequestsにログインUserのIDを追加
                          await updateRequests({
                            variables: {
                              id: node.id,
                              friendRequests: [
                                ...node.friendRequests.edges.map(
                                  ({ node }) => node.id // 相手Userの既存のfriendRequestを展開
                                ),
                                dataMyProfile?.profile.userProf.id, // ログインUserを追加
                              ],
                            },
                          });
                        }}
                      >
                        {
                          //* friendRequestボタンの表記を切り替える
                          myFriends?.includes(node.userProf.id) | //*         既にログインUserのFriendsである場合
                          myfriendRequests?.includes(node.userProf.id) | //* 既にログインUserがFriendRequestを申請済の場合
                          node.friendRequests.edges
                            .map(({ node }) => node.id)
                            .includes(dataMyProfile?.profile.userProf.id) //* 既に相手UserがFriendRequestを申請済の場合
                            ? "requested"
                            : "request"
                        }
                      </button>
                    </li>
                  )
              )
            }
          </ul>
        </Grid>
        <Grid item xs={3}>
          <h3>Friend requests by</h3>
          <ul className={styles.mainPage__list}>
            {
              //* ログインUserにfriendRequestの申請をしている相手Userを一覧表示する。
              dataMyProfile?.profile.friendRequests.edges.map(({ node }) => (
                <li className={styles.mainPage__item} key={node.id}>
                  {node.username}
                  <button
                    onClick={async () => {
                      // friendRequestの承認
                      await approveRequest(node); //* 引数としてログインUserのfriendRequestにある相手Userのオブジェクトを渡す。
                    }}
                  >
                    approve
                  </button>
                </li>
              ))
            }
          </ul>
        </Grid>
        <Grid item xs={3}>
          <h3>Direct Message</h3>
          <ul className={styles.mainPage__list}>
            {dataMsgs?.allMessages.edges.map(({ node }) => (
              <li className={styles.mainPage__item} key={node.id}>
                {node.message}
                <div>
                  <strong>
                    {
                      // DMを送信したUserを表示
                      node.sender.username
                    }
                  </strong>
                  <button
                    className={styles.mainPage__btn}
                    onClick={() => {
                      setSelectedReceiver(node.sender.id);
                      setOpenModal(true);
                    }}
                  >
                    reply
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Grid>
      </Grid>
    </div>
  );
};

export default MainPage;
