export interface MonthlyMicroProject {
  id: string;
  period: string;
  monthLabel: string;
  startDate: string;
  startDateLabel: string;
  completedDate: string;
  dateLabel: string;
  category: string;
  csiDivision: string;
  state: "WI" | "IL" | "IN" | "IA" | "MO";
  status: "Reconciled" | "In Progress";
  incomeUsd: number;
  materialUsd: number;
  laborUsd: number;
  laborHours: number;
  invoiceRef: string;
  fieldLead: string;
  completionPct: number;
  scopeSummary: string;
}

interface MonthSpec {
  period: string;
  monthShort: string;
  monthLabel: string;
  yyMm: string;
  targetUsd: number;
  maxDay: number;
  projectCount: number;
  explicitAmounts?: number[];
  explicitDays?: number[];
}

const CATALOG_TEMPLATES: readonly {
  category: string;
  csiDivision: string;
  fieldLead: string;
  scopeByState: Record<"WI" | "IL" | "IN" | "IA" | "MO", string>;
}[] = [
  {
    category: "Commercial Interior Fit-Out & Metal Framing",
    csiDivision: "Div 09 · Finishes & Cold-Formed Framing",
    fieldLead: "M. Vance · Senior Superintendent",
    scopeByState: {
      WI: "Structural metal stud framing, acoustic batt insulation, and level-4 gypsum assemblies for commercial suite in Milwaukee, WI.",
      IL: "Interior partition framing, rated corridor soffits, and acoustical drywall package in Rockford, IL.",
      IN: "Commercial suite layout, 20-gauge metal framing, and moisture-resistant board installation in Hammond, IN.",
      IA: "Tenant build-out metal stud framing, thermal insulation, and ceiling grid prep in Dubuque, IA.",
      MO: "Interior commercial framing, shaft wall assemblies, and level-4 drywall finishing in St. Louis County, MO.",
    },
  },
  {
    category: "Multi-Family Turnkey Unit Remodel",
    csiDivision: "Div 06 · Rough & Finish Carpentry",
    fieldLead: "R. Kowalski · Field Operations",
    scopeByState: {
      WI: "Multi-unit cabinet installation, solid-core corridor doors, trim carpentry, and subfloor leveling in Madison, WI.",
      IL: "Residential cluster finish carpentry, pre-hung fire doors, and millwork package in Waukegan, IL.",
      IN: "Turnkey apartment trim package, casework installation, and hardware retrofit in Merrillville, IN.",
      IA: "Multi-family interior trim, balcony door replacements, and subfloor underlayment in Davenport, IA.",
      MO: "Residential building millwork, ADA hardware, and common-area finish carpentry in St. Charles, MO.",
    },
  },
  {
    category: "Fire & Water Structural Remediation",
    csiDivision: "Div 02 · Existing Conditions & Restoration",
    fieldLead: "D. Lindqvist · Restoration Lead",
    scopeByState: {
      WI: "Structural truss sistering, smoke sealants, selective demolition, and decking replacement in Waukesha, WI.",
      IL: "Commercial water-loss mitigation, selective drywall removal, and structural drying in Evanston, IL.",
      IN: "Fire-damaged framing reconstruction, char encapsulation, and roof sheathing repair in Gary, IN.",
      IA: "Storm and water remediation, structural joist reinforcement, and vapor barrier restoration in Cedar Rapids, IA.",
      MO: "Selective interior strip-out, structural header replacement, and subfloor reconstruction in Chesterfield, MO.",
    },
  },
  {
    category: "Retail Storefront & Aluminum Glazing",
    csiDivision: "Div 08 · Openings & Glazing Systems",
    fieldLead: "J. Mercer · Commercial Lead",
    scopeByState: {
      WI: "Thermally broken aluminum storefront system, ADA entrance doors, and insulated low-E glazing in Green Bay, WI.",
      IL: "Commercial retail vestibule framing, panic hardware, and tempered glass replacement in Naperville, IL.",
      IN: "Strip-center storefront retrofit, perimeter sealants, and commercial door closers in Crown Point, IN.",
      IA: "Retail façade glazing, aluminum curtainwall sill flashing, and entry doors in Bettendorf, IA.",
      MO: "Commercial storefront assembly, safety glazing, and automatic operator prep in Clayton, MO.",
    },
  },
  {
    category: "Facility MEP Rough-In & Lighting Retrofit",
    csiDivision: "Div 23/26 · HVAC & Electrical Distribution",
    fieldLead: "A. Morales · MEP Coordinator",
    scopeByState: {
      WI: "Branch circuit distribution, LED troffer retrofit, VAV box balancing, and conduit rough-in in Kenosha, WI.",
      IL: "Commercial lighting panel upgrade, emergency egress fixtures, and ductwork insulation in Schaumburg, IL.",
      IN: "Warehouse high-bay LED conversion, sub-panel feeders, and exhaust fan rough-in in Valparaiso, IN.",
      IA: "Office suite HVAC diffuser layout, low-voltage raceways, and LED fixture package in Iowa City, IA.",
      MO: "Commercial electrical rough-in, RTU curb adapter, and supply duct distribution in Creve Coeur, MO.",
    },
  },
  {
    category: "Commercial Roofing & Thermal Envelope",
    csiDivision: "Div 07 · Thermal & Moisture Protection",
    fieldLead: "T. Halvorsen · Envelope Specialist",
    scopeByState: {
      WI: "60-mil TPO membrane installation, tapered polyiso insulation, and pre-finished parapet coping in Racine, WI.",
      IL: "Flat roof membrane recovery, roof drain scuppers, and perimeter counterflashing in Des Plaines, IL.",
      IN: "Commercial roof curb flashing, elastomeric seam sealing, and rigid insulation board in Portage, IN.",
      IA: "EPDM membrane ballast replacement, parapet cap metal, and expansion joint covers in Waterloo, IA.",
      MO: "Modified bitumen roof patching, skylight curb flashing, and coping sealants in Earth City, MO.",
    },
  },
  {
    category: "Civil Concrete Apron & ADA Curb Package",
    csiDivision: "Div 03/32 · Cast-in-Place Concrete & Sitework",
    fieldLead: "K. Braddock · Civil Superintendent",
    scopeByState: {
      WI: "4,000 PSI reinforced concrete loading pad, detectable ADA curb ramps, and control joint sealing in Appleton, WI.",
      IL: "Commercial sidewalk replacement, dumpster enclosure pad, and steel pipe bollards in Elgin, IL.",
      IN: "Loading dock apron slab, doweled expansion joints, and tactile warning plates in Michigan City, IN.",
      IA: "Entry plaza concrete flatwork, curb and gutter replacement, and subbase compaction in Dubuque, IA.",
      MO: "Commercial driveway approach slab, trench drain frame set, and broom-finish walkways in Fenton, MO.",
    },
  },
  {
    category: "Acoustical Ceilings & Partition Package",
    csiDivision: "Div 09 · Acoustical Ceilings & Wall Treatments",
    fieldLead: "M. Vance · Senior Superintendent",
    scopeByState: {
      WI: "15/16-inch heavy-duty suspension grid, NRC 0.75 acoustic lay-in tiles, and seismic perimeter clips in Brookfield, WI.",
      IL: "Medical office acoustic ceiling grid, washable vinyl-faced gypsum tiles, and soffit trim in Oak Brook, IL.",
      IN: "Retail ceiling grid replacement, tegular acoustic tiles, and light fixture support wires in Munster, IN.",
      IA: "Commercial corridor acoustic drop ceiling, insulation blankets, and perimeter molding in Davenport, IA.",
      MO: "Corporate suite acoustic ceiling system, clouds, and sound-rated partition closures in Maryland Heights, MO.",
    },
  },
  {
    category: "Epoxy Flooring & Industrial Slab Coating",
    csiDivision: "Div 09 · High-Performance Floor Coatings",
    fieldLead: "R. Kowalski · Field Operations",
    scopeByState: {
      WI: "Diamond slab grinding, moisture-mitigation primer, and 100%-solids urethane topcoat in Janesville, WI.",
      IL: "Service bay quartz-broadcast epoxy flooring, cove base, and safety striping in Joliet, IL.",
      IN: "Industrial storage room shot-blasting, crack chasing, and high-build epoxy seal in La Porte, IN.",
      IA: "Commercial kitchen quarry tile regrout and slip-resistant resinous floor system in Cedar Rapids, IA.",
      MO: "Warehouse aisleway epoxy line striping, joint polyurea filler, and clear sealer in Hazelwood, MO.",
    },
  },
  {
    category: "Structural Steel Mezzanine & Safety Railings",
    csiDivision: "Div 05 · Structural & Miscellaneous Metals",
    fieldLead: "K. Braddock · Civil Superintendent",
    scopeByState: {
      WI: "Wide-flange steel framing, bar-grating platform, OSHA pipe handrails, and anchor bolts in Beloit, WI.",
      IL: "Interior equipment platform, steel pan stairs, and welded guardrail assembly in Aurora, IL.",
      IN: "Loading dock steel edge angles, safety bollards, and galvanized access ladder in East Chicago, IN.",
      IA: "Mezzanine stair stringers, weld plates, and powder-coated safety gates in Bettendorf, IA.",
      MO: "Structural lintel installation, masonry bearing plates, and exterior pipe railings in St. Peters, MO.",
    },
  },
  {
    category: "Fire-Stopping, Rated Doors & Life Safety",
    csiDivision: "Div 07/08 · Fire Protection & Rated Openings",
    fieldLead: "D. Lindqvist · Restoration Lead",
    scopeByState: {
      WI: "90-minute hollow-metal door frames, intumescent through-penetration firestopping, and smoke gasketing in Sheboygan, WI.",
      IL: "Corridor fire-door replacement, UL-listed firestop caulking, and closer adjustments in Skokie, IL.",
      IN: "Stairwell rated door hardware, vision lites, and floor-to-floor fire safing in Schererville, IN.",
      IA: "Mechanical room rated wall penetrations, louver doors, and panic exit devices in Dubuque, IA.",
      MO: "Commercial egress door package, magnetic hold-opens, and fire-rated sealant in Arnold, MO.",
    },
  },
  {
    category: "Exterior Masonry Tuckpointing & Sealants",
    csiDivision: "Div 04/07 · Masonry Restoration & Joint Sealants",
    fieldLead: "T. Halvorsen · Envelope Specialist",
    scopeByState: {
      WI: "Brick façade mortar grinding, Type N tuckpointing, steel lintel priming, and urethane control joints in Oshkosh, WI.",
      IL: "Commercial masonry parapet rebuild, thru-wall flashing, and silane water repellent in Cicero, IL.",
      IN: "CMU warehouse wall joint routing, backer rod installation, and elastomeric sealant in Hobart, IN.",
      IA: "Limestone sill resetting, brick veneer repointing, and window perimeter caulking in Davenport, IA.",
      MO: "Exterior brick façade restoration, expansion joint replacement, and weep hole clearing in Kirkwood, MO.",
    },
  },
  {
    category: "Mini-Project · Commercial Door & Hardware Service",
    csiDivision: "Div 08 · Commercial Doors, Frames & ADA Hardware",
    fieldLead: "J. Mercer · Commercial Lead",
    scopeByState: {
      WI: "Rapid-turnaround commercial door closer replacement, panic bar adjustment, and weatherstripping package.",
      IL: "Retail back-of-house hollow-metal door slab replacement and heavy-duty hinge reinforcement.",
      IN: "ADA push-plate actuator wiring, threshold ramp leveling, and lockset re-keying package.",
      IA: "Commercial entry vestibule door alignment, pivot hardware replacement, and perimeter sealants.",
      MO: "Fire-rated stairwell door closer replacement, smoke gasket install, and latch bolt service.",
    },
  },
  {
    category: "Mini-Project · Tenant Drywall & Acoustic Patch",
    csiDivision: "Div 09 · Gypsum Board & Acoustical Ceiling Service",
    fieldLead: "M. Vance · Senior Superintendent",
    scopeByState: {
      WI: "Localized drywall partition repair, level-4 skim coat, prime/paint, and acoustic tile replacement.",
      IL: "Commercial suite demising wall patch, corner bead reinforcement, and ceiling grid realignment.",
      IN: "Retail stockroom moisture-resistant board replacement, taping, and interior finish touch-up.",
      IA: "Office corridor soffit repair, acoustic lay-in tile replacement, and wall finish restoration.",
      MO: "Medical suite plumbing-access drywall closure, sound batt infill, and hygienic finish coat.",
    },
  },
  {
    category: "Mini-Project · Concrete Sidewalk & Bollard Service",
    csiDivision: "Div 03/32 · Minor Flatwork & Site Safety",
    fieldLead: "K. Braddock · Civil Superintendent",
    scopeByState: {
      WI: "Trip-hazard sidewalk panel replacement, broom-finish concrete pour, and safety bollard installation.",
      IL: "Loading zone pipe bollard core-drilling, concrete grout fill, and high-visibility yellow coating.",
      IN: "ADA curb ramp tactile warning plate retrofit and localized concrete spall repair.",
      IA: "Commercial entryway slab joint sealing, cracked panel saw-cut removal, and 4,000 PSI pour.",
      MO: "Dumpster pad approach apron patch, steel corner guards, and expansion joint sealant.",
    },
  },
  {
    category: "Mini-Project · LED Lighting & Sub-Panel Service",
    csiDivision: "Div 26 · Commercial Electrical & Lighting Service",
    fieldLead: "A. Morales · MEP Coordinator",
    scopeByState: {
      WI: "Commercial canopy LED fixture retrofit, photocell sensor replacement, and circuit breaker service.",
      IL: "Retail sales floor 2x4 LED troffer upgrade, emergency battery pack test, and exit sign install.",
      IN: "Warehouse dock door task lighting, GFCI receptacle circuit addition, and EMT conduit run.",
      IA: "Office suite dimmer control retrofit, occupancy sensor calibration, and panel schedule update.",
      MO: "Exterior parking lot wall-pack LED conversion, timer relay replacement, and junction box seal.",
    },
  },
];

const STATE_ROTATION: readonly ("WI" | "IL" | "IN" | "IA" | "MO")[] = [
  "WI", "WI", "IL", "WI", "WI", "IL", "WI", "IN", "WI", "WI",
  "IL", "WI", "IA", "WI", "WI", "IL", "WI", "MO", "WI", "IL",
];

const MONTH_SPECS: readonly MonthSpec[] = [
  {
    period: "2026-01",
    monthShort: "Jan",
    monthLabel: "January 2026",
    yyMm: "2601",
    targetUsd: 425000,
    maxDay: 30,
    projectCount: 58,
  },
  {
    period: "2026-02",
    monthShort: "Feb",
    monthLabel: "February 2026",
    yyMm: "2602",
    targetUsd: 657680,
    maxDay: 27,
    projectCount: 72,
  },
  {
    period: "2026-03",
    monthShort: "Mar",
    monthLabel: "March 2026",
    yyMm: "2603",
    targetUsd: 719789,
    maxDay: 31,
    projectCount: 78,
  },
  {
    period: "2026-04",
    monthShort: "Apr",
    monthLabel: "April 2026",
    yyMm: "2604",
    targetUsd: 700789,
    maxDay: 30,
    projectCount: 76,
  },
  {
    period: "2026-05",
    monthShort: "May",
    monthLabel: "May 2026",
    yyMm: "2605",
    targetUsd: 825679,
    maxDay: 30,
    projectCount: 86,
  },
  {
    period: "2026-06",
    monthShort: "Jun",
    monthLabel: "June 2026",
    yyMm: "2606",
    targetUsd: 921578,
    maxDay: 30,
    projectCount: 94,
  },
  {
    period: "2026-07",
    monthShort: "Jul",
    monthLabel: "July 2026",
    yyMm: "2607",
    targetUsd: 908792,
    maxDay: 31,
    projectCount: 92,
  },
  {
    period: "2026-08",
    monthShort: "Aug",
    monthLabel: "August 2026",
    yyMm: "2608",
    targetUsd: 940789,
    maxDay: 31,
    projectCount: 98,
  },
  {
    period: "2026-09",
    monthShort: "Sep",
    monthLabel: "September 2026",
    yyMm: "2609",
    targetUsd: 938489,
    maxDay: 30,
    projectCount: 96,
  },
  {
    period: "2026-10",
    monthShort: "Oct",
    monthLabel: "October 2026",
    yyMm: "2610",
    targetUsd: 21789,
    maxDay: 7,
    projectCount: 6,
    explicitAmounts: [4850, 3920, 3640, 3410, 3180, 2789],
    explicitDays: [2, 3, 4, 5, 6, 7],
  },
];

function buildMonthlyMicroProjects(): readonly MonthlyMicroProject[] {
  const result: MonthlyMicroProject[] = [];
  let globalSeq = 1;

  for (const spec of MONTH_SPECS) {
    const count = spec.projectCount;
    let amounts: number[];

    if (spec.explicitAmounts) {
      amounts = [...spec.explicitAmounts];
    } else {
      const weights: number[] = [];
      for (let i = 0; i < count; i++) {
        // Mix of standard projects (higher weight) and mini-projects (lower weight)
        const isMini = i % 3 === 2;
        const baseW = isMini
          ? 8 + ((i * 7) % 9) // mini-projects
          : 22 + Math.round(((count - i) / count) * 26) + ((i * 5) % 7);
        weights.push(baseW);
      }
      const totalWeight = weights.reduce((acc, w) => acc + w, 0);
      amounts = weights.map((w) => Math.max(1850, Math.round((spec.targetUsd * w) / totalWeight)));
      const currentSum = amounts.reduce((acc, v) => acc + v, 0);
      const diff = spec.targetUsd - currentSum;
      amounts[0] += diff;
    }

    for (let i = 0; i < count; i++) {
      const state = STATE_ROTATION[(globalSeq + i) % STATE_ROTATION.length];
      const tpl = CATALOG_TEMPLATES[(globalSeq + i * 3) % CATALOG_TEMPLATES.length];
      const day = spec.explicitDays
        ? spec.explicitDays[i]
        : Math.min(
            spec.maxDay,
            Math.max(1, Math.round(1 + ((i * (spec.maxDay - 1)) / Math.max(1, count - 1))))
          );
      const dayPadded = String(day).padStart(2, "0");
      const completedDate = `${spec.period}-${dayPadded}`;
      const dateLabel = `${spec.monthShort} ${dayPadded}, 2026`;
      const seqPadded = String(globalSeq).padStart(3, "0");

      const [yrStr, moStr] = spec.period.split("-");
      const year = parseInt(yrStr, 10);
      const month = parseInt(moStr, 10);

      // Varied start date: between 4 and 14 days before completedDate
      // If subtracting falls before day 1, use a day from previous month or 01 of current month
      // varied with Math.max(1, day - (3 + ((globalSeq * 5) % 9)))
      const durationOffset = 4 + ((globalSeq * 5) % 11); // 4 to 14 days
      let startYear = year;
      let startMonth = month;
      let startDay = day - durationOffset;

      if (startDay < 1) {
        if (month > 1 && globalSeq % 2 === 0) {
          // Span from previous month
          const prevMonthLastDate = new Date(Date.UTC(year, month - 1, 0));
          const prevMaxDay = prevMonthLastDate.getUTCDate();
          startMonth = month - 1;
          startDay = Math.max(1, prevMaxDay + startDay);
        } else {
          // Same month varied between 1 and min(day, 4)
          const formulaDay = Math.max(1, day - (3 + ((globalSeq * 5) % 9)));
          startDay = Math.min(day, formulaDay > 0 ? formulaDay : 1 + ((globalSeq * 2) % Math.max(1, Math.min(4, day))));
        }
      }

      const MONTH_NAMES = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      const startDayPadded = String(startDay).padStart(2, "0");
      const startMonthPadded = String(startMonth).padStart(2, "0");
      const startDate = `${startYear}-${startMonthPadded}-${startDayPadded}`;
      const startDateLabel = `${MONTH_NAMES[startMonth - 1]} ${startDayPadded}, ${startYear}`;

      const materialUsd = Math.round(amounts[i] * (0.42 + ((globalSeq * 7) % 15) / 100));
      const laborUsd = amounts[i] - materialUsd;
      const laborHours = Math.max(24, Math.round(laborUsd / (68 + ((globalSeq * 3) % 18))));

      result.push({
        id: `TPRJ-${spec.yyMm}-${seqPadded}`,
        period: spec.period,
        monthLabel: spec.monthLabel,
        startDate,
        startDateLabel,
        completedDate,
        dateLabel,
        category: tpl.category,
        csiDivision: tpl.csiDivision,
        state,
        status: "Reconciled",
        incomeUsd: amounts[i],
        materialUsd,
        laborUsd,
        laborHours,
        invoiceRef: `INV-${spec.yyMm}-${String(100 + i + 1)}`,
        fieldLead: tpl.fieldLead,
        completionPct: 100,
        scopeSummary: tpl.scopeByState[state],
      });

      globalSeq++;
    }
  }

  return result;
}

export const MONTHLY_MICROPROJECTS_2026: readonly MonthlyMicroProject[] =
  buildMonthlyMicroProjects();

export function getMicroProjectsByPeriod(period: string): MonthlyMicroProject[] {
  return MONTHLY_MICROPROJECTS_2026.filter((item) => item.period === period);
}

export function getPeriodMicroProjectsTotal(period: string): number {
  return getMicroProjectsByPeriod(period).reduce((sum, item) => sum + item.incomeUsd, 0);
}

export function getPeriodMaterialsTotal(period: string): number {
  return getMicroProjectsByPeriod(period).reduce((sum, item) => sum + item.materialUsd, 0);
}

export function getPeriodLaborTotal(period: string): number {
  return getMicroProjectsByPeriod(period).reduce((sum, item) => sum + item.laborUsd, 0);
}

export function getPeriodHoursTotal(period: string): number {
  return getMicroProjectsByPeriod(period).reduce((sum, item) => sum + item.laborHours, 0);
}
