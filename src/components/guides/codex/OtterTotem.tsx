import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { OTTER_TOTEMS } from "../../../config/constants";

const OtterTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Otter,
      variants: OTTER_TOTEMS
    }}/>
};

export default OtterTotem;
