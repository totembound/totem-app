import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { BEAVER_TOTEMS } from "../../../config/constants";

const BeaverTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Beaver,
      variants: BEAVER_TOTEMS
    }}/>
};

export default BeaverTotem;
