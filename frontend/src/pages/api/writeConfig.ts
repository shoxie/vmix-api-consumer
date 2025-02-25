// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import fsPromises from "fs/promises";
import path from "path";

type Data = {
  name: string;
};

// type Config = {
//   authkey: string;
// }

const dataFilePath = path.join(process.cwd(), "json/userData.json");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === "GET") {
      // Read the existing data from the JSON file
      const jsonData = await fsPromises.readFile(dataFilePath);
      const objectData = JSON.parse(jsonData as unknown as string);

      // Get the data from the request body
      const { name, email } = req.body;

      // Add the new data to the object
      const newData = {
        name,
        email
      };
      objectData.push(newData);

      // Convert the object back to a JSON string
      const updatedData = JSON.stringify(objectData);

      // Write the updated data to the JSON file
      await fsPromises.writeFile(dataFilePath, updatedData);

    res.status(200).json(objectData);
  }
}
