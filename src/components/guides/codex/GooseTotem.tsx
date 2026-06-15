import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const GooseTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Goose);
    return <TotemView config={{
      species: Species.Goose,
      variants
    }}/>
};

export default GooseTotem;
