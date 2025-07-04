import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { DEER_TOTEMS } from "../../../config/constants";

const DeerTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Deer,
      variants: DEER_TOTEMS
    }}/>
};

export default DeerTotem;
