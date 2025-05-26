import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { GOOSE_TOTEMS } from "../../../config/constants";

const GooseTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Goose,
      variants: GOOSE_TOTEMS
    }}/>
};

export default GooseTotem;
