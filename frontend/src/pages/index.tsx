import { Box, Grid, GridItem, HStack, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getMatchData, getMatcheIds } from "@/api/default";
import { MatchResponse } from "@/types/Matches";
import ConfigModal from "@/components/common/ConfigModal";

const Home = () => {
  const [matches, setMatches] = useState<MatchResponse[]>([]);

  useEffect(() => {
    getMatcheIds().then((response) => {
      response.battleids.map((battleId: string) => {
        getMatchData(battleId).then((response) => {
          setMatches((prev) => [...prev, response]);
        });
      });
    });
  }, []);

  return (
    <Box>
      <Grid p={4} templateColumns="repeat(4, 1fr)" gap={5}>
        {matches.map((match) => (
          <GridItem colSpan={1} key={match.data.battleid}>
            <VStack gap={5} p={4} borderWidth="1px" alignItems={"start"} w={"100%"}>
              <HStack justify={"space-between"} w={"100%"}>
                <Box>
                  {match.data.roomname ? match.data.roomname : "No room name"}
                </Box>
                <Box>
                  {match.data.state}
                </Box>
              </HStack>
              {
                match.data.camp_list?.length > 0 && (
                  <VStack>
                    <Text>{match.data.camp_list[0]?.team_name ?? "N/A"} vs {match.data.camp_list[1]?.team_name ?? "N/A"}</Text>
                  </VStack>
                )
              }
              <Box>
                <ConfigModal matchData={match.data} />
              </Box>
              <Box>
                <Text>{match.data.battleid}</Text>
              </Box>
            </VStack>
          </GridItem>
        ))}
      </Grid>
    </Box>
  );
}

export default Home;