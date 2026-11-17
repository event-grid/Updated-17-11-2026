package com.evntgrid.catalog.domain;

/** Text after a dash or colon on a source service line (assumption A-04). */
public enum OptionKind {
    /** A named choice, such as "choultry" or "Veg". */
    OPTION,
    /** A property with no values listed in the source, such as "Cost" or "Type" (D-11). */
    ATTRIBUTE
}
