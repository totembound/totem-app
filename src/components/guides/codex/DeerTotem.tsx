import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { GOOSE_TOTEMS } from "../../../config/constants";

const DeerTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Deer,
      variants: []
    }}/>
};

export default DeerTotem;
