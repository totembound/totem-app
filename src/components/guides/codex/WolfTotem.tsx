import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { WOLF_TOTEMS } from "../../../config/constants";

const WolfTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Wolf,
      variants: WOLF_TOTEMS
    }}/>
};

export default WolfTotem;
