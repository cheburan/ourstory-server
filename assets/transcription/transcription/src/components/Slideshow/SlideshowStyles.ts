import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles({
  slideshowContainer: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  slideshowContentContainer: {
    flexGrow: 4,
  }
});

export default useStyles;
