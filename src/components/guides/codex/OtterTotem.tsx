import React from "react";
import { TotemView } from "./TotemView";
import { Species } from "../../../types/types";
import { useCodexVariants } from "../../../utils/species";

const OtterTotem: React.FC = () => {
    const variants = useCodexVariants(Species.Otter);
    return <TotemView config={{
      species: Species.Otter,
      variants
    }}/>
};

export default OtterTotem;
