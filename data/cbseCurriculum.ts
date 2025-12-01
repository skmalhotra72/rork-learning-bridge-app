export interface ConceptInfo {
  number: number;
  name: string;
  concepts: string[];
  prerequisites: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  commonMistakes?: string[];
  realWorldExamples?: string[];
  practicalApplications?: string[];
  examImportance?: 'low' | 'medium' | 'high' | 'very high';
}

export interface GradeData {
  chapters: ConceptInfo[];
}

export interface SubjectCurriculum {
  grades: {
    [grade: number]: GradeData;
  };
}

export const CBSE_CURRICULUM: { [subject: string]: SubjectCurriculum } = {
  Mathematics: {
    grades: {
      6: {
        chapters: [
          {
            number: 1,
            name: "Knowing Our Numbers",
            concepts: ["Place Value", "Number System", "Large Numbers", "Estimation"],
            prerequisites: [],
            difficulty: "easy",
            commonMistakes: ["Place value confusion", "Reading large numbers"]
          },
          {
            number: 2,
            name: "Whole Numbers",
            concepts: ["Natural Numbers", "Whole Numbers", "Properties", "Number Line"],
            prerequisites: ["Knowing Our Numbers"],
            difficulty: "easy"
          },
          {
            number: 3,
            name: "Playing with Numbers",
            concepts: ["Factors", "Multiples", "Prime Numbers", "HCF", "LCM"],
            prerequisites: ["Whole Numbers"],
            difficulty: "medium"
          }
        ]
      },
      7: {
        chapters: [
          {
            number: 1,
            name: "Integers",
            concepts: ["Positive Numbers", "Negative Numbers", "Addition", "Subtraction", "Multiplication", "Division"],
            prerequisites: ["Whole Numbers from Class 6"],
            difficulty: "medium",
            commonMistakes: ["Sign errors", "Negative × Negative confusion"]
          },
          {
            number: 2,
            name: "Fractions and Decimals",
            concepts: ["Proper Fractions", "Improper Fractions", "Mixed Numbers", "Decimal Places", "Operations"],
            prerequisites: ["Basic arithmetic"],
            difficulty: "medium"
          }
        ]
      },
      8: {
        chapters: [
          {
            number: 1,
            name: "Rational Numbers",
            concepts: ["Rational Numbers", "Properties", "Operations", "Number Line Representation"],
            prerequisites: ["Integers", "Fractions"],
            difficulty: "medium",
            realWorldExamples: ["Money calculations", "Temperature", "Measurements"]
          },
          {
            number: 2,
            name: "Linear Equations in One Variable",
            concepts: ["Variables", "Expressions", "Equations", "Solving", "Word Problems"],
            prerequisites: ["Basic algebra", "Integers"],
            difficulty: "medium"
          }
        ]
      },
      9: {
        chapters: [
          {
            number: 1,
            name: "Number Systems",
            concepts: ["Rational Numbers", "Irrational Numbers", "Real Numbers", "Decimal Expansions", "Operations"],
            prerequisites: ["Rational numbers from Class 8"],
            difficulty: "medium",
            commonMistakes: ["√2 is rational misconception", "Decimal expansion confusion"]
          },
          {
            number: 2,
            name: "Polynomials",
            concepts: ["Polynomials", "Degree", "Coefficients", "Zeroes", "Factorization"],
            prerequisites: ["Algebraic expressions"],
            difficulty: "medium"
          },
          {
            number: 3,
            name: "Linear Equations in Two Variables",
            concepts: ["Linear equations", "Graphing", "Solutions", "Simultaneous equations"],
            prerequisites: ["Linear equations in one variable"],
            difficulty: "medium"
          }
        ]
      },
      10: {
        chapters: [
          {
            number: 1,
            name: "Real Numbers",
            concepts: ["Euclid's Division Lemma", "HCF", "LCM", "Fundamental Theorem of Arithmetic", "Irrational Numbers"],
            prerequisites: ["Number systems from Class 9"],
            difficulty: "medium",
            examImportance: "high",
            commonMistakes: ["Euclid's algorithm steps", "Prime factorization errors"]
          },
          {
            number: 2,
            name: "Polynomials",
            concepts: ["Quadratic polynomials", "Zeroes", "Relationship between zeroes and coefficients", "Division algorithm"],
            prerequisites: ["Polynomials from Class 9"],
            difficulty: "medium",
            examImportance: "high"
          },
          {
            number: 3,
            name: "Pair of Linear Equations in Two Variables",
            concepts: ["Graphical method", "Algebraic methods", "Substitution", "Elimination", "Cross-multiplication"],
            prerequisites: ["Linear equations"],
            difficulty: "medium",
            examImportance: "high"
          },
          {
            number: 4,
            name: "Quadratic Equations",
            concepts: ["Standard form", "Factorization", "Completing the square", "Quadratic formula", "Nature of roots"],
            prerequisites: ["Polynomials", "Factorization"],
            difficulty: "hard",
            examImportance: "very high",
            commonMistakes: ["Discriminant interpretation", "Sign errors in formula"]
          }
        ]
      },
      11: {
        chapters: [
          {
            number: 1,
            name: "Sets",
            concepts: ["Set notation", "Types of sets", "Operations", "Venn diagrams"],
            prerequisites: [],
            difficulty: "medium"
          },
          {
            number: 2,
            name: "Relations and Functions",
            concepts: ["Relations", "Functions", "Domain", "Range", "Types of functions"],
            prerequisites: ["Sets"],
            difficulty: "medium"
          }
        ]
      },
      12: {
        chapters: [
          {
            number: 1,
            name: "Relations and Functions",
            concepts: ["Types of relations", "Types of functions", "Composition", "Inverse functions"],
            prerequisites: ["Relations and Functions from Class 11"],
            difficulty: "hard",
            examImportance: "very high"
          },
          {
            number: 2,
            name: "Inverse Trigonometric Functions",
            concepts: ["Domain", "Range", "Principal values", "Properties"],
            prerequisites: ["Trigonometry"],
            difficulty: "hard",
            examImportance: "high"
          }
        ]
      }
    }
  },
  
  Physics: {
    grades: {
      9: {
        chapters: [
          {
            number: 1,
            name: "Motion",
            concepts: ["Distance", "Displacement", "Speed", "Velocity", "Acceleration", "Equations of motion"],
            prerequisites: ["Basic mathematics"],
            difficulty: "medium",
            practicalApplications: ["Vehicle motion", "Sports"],
            commonMistakes: ["Speed vs velocity confusion", "Sign conventions"]
          },
          {
            number: 2,
            name: "Force and Laws of Motion",
            concepts: ["Force", "Newton's Laws", "Momentum", "Conservation of momentum"],
            prerequisites: ["Motion concepts"],
            difficulty: "medium"
          }
        ]
      },
      10: {
        chapters: [
          {
            number: 1,
            name: "Light - Reflection and Refraction",
            concepts: ["Laws of reflection", "Mirror formula", "Refraction", "Lenses", "Lens formula"],
            prerequisites: ["Basic geometry", "Light concepts"],
            difficulty: "medium",
            examImportance: "very high",
            practicalApplications: ["Mirrors", "Spectacles", "Camera"],
            commonMistakes: ["Sign conventions", "Ray diagrams"]
          },
          {
            number: 2,
            name: "Electricity",
            concepts: ["Electric current", "Ohm's law", "Resistance", "Series and parallel circuits", "Heating effect"],
            prerequisites: ["Basic physics"],
            difficulty: "medium",
            examImportance: "very high",
            realWorldExamples: ["Home wiring", "Electrical appliances"]
          }
        ]
      },
      11: {
        chapters: [
          {
            number: 1,
            name: "Physical World",
            concepts: ["Physics scope", "Nature of physical laws", "Physics and technology"],
            prerequisites: [],
            difficulty: "easy"
          }
        ]
      },
      12: {
        chapters: [
          {
            number: 1,
            name: "Electric Charges and Fields",
            concepts: ["Coulomb's law", "Electric field", "Electric flux", "Gauss's law"],
            prerequisites: ["Electrostatics from Class 11"],
            difficulty: "hard",
            examImportance: "very high"
          }
        ]
      }
    }
  },
  
  Chemistry: {
    grades: {
      9: {
        chapters: [
          {
            number: 1,
            name: "Matter in Our Surroundings",
            concepts: ["States of matter", "Properties", "Change of state", "Evaporation"],
            prerequisites: [],
            difficulty: "easy",
            practicalApplications: ["Cooking", "Weather", "Daily life"]
          }
        ]
      },
      10: {
        chapters: [
          {
            number: 1,
            name: "Chemical Reactions and Equations",
            concepts: ["Chemical reactions", "Balancing equations", "Types of reactions"],
            prerequisites: ["Basic chemistry"],
            difficulty: "medium",
            examImportance: "high",
            commonMistakes: ["Balancing errors", "Product prediction"]
          }
        ]
      }
    }
  },
  
  Biology: {
    grades: {
      9: {
        chapters: [
          {
            number: 1,
            name: "The Fundamental Unit of Life",
            concepts: ["Cell structure", "Cell organelles", "Functions"],
            prerequisites: [],
            difficulty: "medium"
          }
        ]
      },
      10: {
        chapters: [
          {
            number: 1,
            name: "Life Processes",
            concepts: ["Nutrition", "Respiration", "Transportation", "Excretion"],
            prerequisites: ["Cell biology"],
            difficulty: "medium",
            examImportance: "very high"
          }
        ]
      }
    }
  }
};

export const getChapterInfo = (subject: string, grade: number, chapterNumber: number): ConceptInfo | null => {
  try {
    const chapters = CBSE_CURRICULUM[subject]?.grades[grade]?.chapters;
    return chapters?.find(ch => ch.number === chapterNumber) || null;
  } catch (error) {
    console.error('Error getting chapter info:', error);
    return null;
  }
};

export const getPrerequisites = (subject: string, grade: number, chapterName: string): string[] => {
  try {
    const chapters = CBSE_CURRICULUM[subject]?.grades[grade]?.chapters;
    const chapter = chapters?.find(ch => ch.name === chapterName);
    return chapter?.prerequisites || [];
  } catch {
    return [];
  }
};

export const findConceptInCurriculum = (subject: string, concept: string): { grade: number; chapter: string; concepts: string[] } | null => {
  try {
    const subjectData = CBSE_CURRICULUM[subject];
    if (!subjectData) return null;
    
    for (const [grade, gradeData] of Object.entries(subjectData.grades)) {
      for (const chapter of gradeData.chapters) {
        if (chapter.concepts.some(c => c.toLowerCase().includes(concept.toLowerCase()))) {
          return {
            grade: parseInt(grade),
            chapter: chapter.name,
            concepts: chapter.concepts
          };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
};
