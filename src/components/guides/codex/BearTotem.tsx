import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const BearTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Bear);
    return <TotemView config={{
      species: Species.Bear,
      variants
    }}/>
};

export default BearTotem;
