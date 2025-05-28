import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { FALCON_TOTEMS } from "../../../config/constants";

const FalconTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Falcon,
      variants: FALCON_TOTEMS
    }}/>
};

export default FalconTotem;
