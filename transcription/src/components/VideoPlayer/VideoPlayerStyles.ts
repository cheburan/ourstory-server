import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  videoControlsContainer: {
    display: "flex",
    left: "50%",
    position: "absolute",
    bottom: "50%",
    transform: "translate(-50%, 50%)",
  },
  videoPlayerButton: {
    background: "linear-gradient(45deg, #d9534f 40%, #d9534f 90%)",
  },
  roundButton: {
    borderRadius: "25px",
    width: "128px",
    height: "128px",
    color: "white",
    display: "relative",
  },
  videoPlayerContainer: {
    position: "relative",
    bottom: 0,
    top: 0,
    right: 0,
    left: 0,
    // padding: "20px",
  },
  progressBarContainer: {
    left: "0",
    bottom: "0",
    marginBottom: "-39px",
    transform: "translateY(calc(-100% - 16px))",
  },
  progressBarColor: {
    color: "#f54414",
  },
  progressBarRoot: {
    padding: "0px",
    width: "96%",
    transform: "translateX(2%)",
    height: 4,
  },
  progressBarRail: {
    height: 4,
  },
  progressBarTrack: {
    height: 4,
  },
  progressBarThumb: {
    height: 12,
    marginTop: -4,
  },
  progressBarMark: {
    height: 10,
    marginTop: -3,
  },
});

export default useStyles;
