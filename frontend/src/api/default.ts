import axiosClient from "../helper/axiosClient";

export const getMatcheIds = async () => {
  return axiosClient.get("/battlelist/playing").then((response) => response.data);
};

export const getMatchData = async (matchId: string) => {
  return axiosClient.get(`/battledata?battleid=${matchId}&dataid=0`).then((response) => response.data);
};