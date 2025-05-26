import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";

const BearTotem: React.FC = () => {
    return <TotemView config={{
      species: Species.Bear,
      variants: []
    }}/>
};

export default BearTotem;
