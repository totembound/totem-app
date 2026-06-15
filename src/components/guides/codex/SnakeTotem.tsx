import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const SnakeTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Snake);
    return <TotemView config={{
      species: Species.Snake,
      variants
    }}/>
};

export default SnakeTotem;
