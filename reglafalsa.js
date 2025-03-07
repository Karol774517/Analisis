// Definir precisión decimal
let decimales = 4;

// Función para reemplazar funciones matemáticas con sus equivalentes de Math
function replaceMathFunctions(input) {
  return input
    .replace(/e/g, "Math.E")
    .replace(/exp/g, "Math.exp")
    .replace(/log/g, "Math.log")
    .replace(/sin/g, "Math.sin")
    .replace(/cos/g, "Math.cos")
    .replace(/tan/g, "Math.tan")
    .replace(/sqrt/g, "Math.sqrt");
}

// Función para crear una función evaluable a partir de una expresión matemática
function parseFunction(input) {
  let formattedInput = replaceMathFunctions(input);
  return new Function("x", `return ${formattedInput};`);
}

// Función principal del método de regla falsa
function falsePositionMethod(func, xi, xs, margenError, funcInput) {
  if (func(xi) * func(xs) >= 0) {
    alert(
      "El Teorema de Bolzano no se cumple: f(xi) y f(xs) deben tener signos opuestos."
    );
    return;
  }

  let xr_old = xi;
  let error = 100;
  let iter = 0;
  const round = (num) => parseFloat(num.toFixed(decimales));
  let resultsTable = document.querySelector("#resultsTable tbody");
  let iterationsDiv = document.getElementById("iterations");
  resultsTable.innerHTML = "";
  iterationsDiv.innerHTML = "";

  // Arreglos para almacenar datos para el PDF
  let iteraciones = [];

  while (error > margenError) {
    iter++;
    let f_xi = round(func(xi));
    let f_xs = round(func(xs));
    let xr = round(xs - (f_xs * (xi - xs)) / (f_xi - f_xs));
    let f_xr = round(func(xr));
    error = round(Math.abs((xr - xr_old) / xr) * 100);

    // Determinar en qué intervalo está la raíz
    let intervalo = "";
    let nuevoIntervalo = "";
    if (f_xi * f_xr < 0) {
      intervalo = `[${xi}, ${xr}]`;
      nuevoIntervalo = `Hacemos Xs = ${xr}`;
      xs = xr;
    } else {
      intervalo = `[${xr}, ${xs}]`;
      nuevoIntervalo = `Hacemos Xi = ${xr}`;
      xi = xr;
    }

    // Guardar datos de la iteración
    iteraciones.push({
      iter: iter,
      xi: xi,
      xs: xs,
      xr: xr,
      f_xi: f_xi,
      f_xs: f_xs,
      f_xr: f_xr,
      error: error,
      intervalo: intervalo,
      nuevoIntervalo: nuevoIntervalo,
    });

    let row = `<tr>
                    <td>${iter}</td>
                    <td>${xi}</td>
                    <td>${xs}</td>
                    <td>${xr}</td>
                    <td>${f_xi}</td>
                    <td>${f_xs}</td>
                    <td>${f_xr}</td>
                    <td>${error}</td>
                </tr>`;
    resultsTable.innerHTML += row;

    iterationsDiv.innerHTML += `Iteración ${iter}\nxi = ${xi}, xs = ${xs}\nxr = ${xr}\nf(xi) = ${f_xi}, f(xs) = ${f_xs}, f(xr) = ${f_xr}\nError = ${error} %\n\n`;

    if (error <= margenError) {
      let mensaje = `Raíz aproximada encontrada en xr = ${xr}`;
      alert(mensaje);
      generarPDF(
        funcInput,
        xi,
        xs,
        margenError,
        decimales,
        iteraciones,
        xr,
        f_xr
      );
      return;
    }

    xr_old = xr;
  }
}

// Función para ejecutar el método de regla falsa
function runFalsePosition() {
  let funcInput = document.getElementById("func").value;
  let func = parseFunction(funcInput);
  let xi = parseFloat(document.getElementById("xi").value);
  let xs = parseFloat(document.getElementById("xs").value);
  let margenError = parseFloat(document.getElementById("error").value);

  // Obtener los nombres directamente de los h3 en el HTML
  falsePositionMethod(func, xi, xs, margenError, funcInput);
}

// Función para generar el PDF
function generarPDF(
  funcInput,
  xi_inicial,
  xs_inicial,
  margenError,
  decimales,
  iteraciones,
  raiz,
  f_raiz
) {
  // Cargar jsPDF desde CDN si no está cargado
  if (typeof jsPDF === "undefined") {
    let script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = function () {
      // Cargar jspdf-autotable para las tablas
      let autoTableScript = document.createElement("script");
      autoTableScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js";
      autoTableScript.onload = function () {
        crearPDF();
      };
      document.head.appendChild(autoTableScript);
    };
    document.head.appendChild(script);
  } else {
    crearPDF();
  }

  function crearPDF() {
    // Obtener nombres de estudiantes del HTML
    const h3Elements = document.querySelectorAll("h3");
    let estudiantes = "";
    h3Elements.forEach((el, index) => {
      estudiantes +=
        el.textContent + (index < h3Elements.length - 1 ? ", " : "");
    });

    // Crear objeto jsPDF
    let doc;

    if (typeof window.jspdf !== "undefined") {
      const { jsPDF } = window.jspdf;
      doc = new jsPDF();
    } else if (typeof jsPDF !== "undefined") {
      doc = new jsPDF();
    } else {
      alert(
        "Error: No se pudo cargar la biblioteca jsPDF. Asegúrese de incluir la biblioteca en su HTML."
      );
      return;
    }

    // Configuración de estilos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);

    // Título
    doc.text("Método de Regla Falsa", 105, 20, { align: "center" });

    // Nombres de los estudiantes
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Estudiantes: ${estudiantes}`, 20, 30);

    // Datos iniciales
    doc.setFontSize(12);
    doc.text(`Función: ${funcInput}`, 20, 40);
    doc.text(`Valores iniciales:`, 20, 50);
    doc.text(
      `xi = ${xi_inicial} ; xs = ${xs_inicial} ; ea = ${margenError}% ; precisión = ${decimales} decimales`,
      30,
      60
    );

    // Iteraciones
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Iteraciones:", 20, 75);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let y = 85;
    for (let i = 0; i < iteraciones.length; i++) {
      const iter = iteraciones[i];

      // Verificar si necesitamos una nueva página
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`Iteración ${iter.iter}`, 20, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.text(`xi = ${iter.xi}, xs = ${iter.xs}, xr = ${iter.xr}`, 25, y);
      y += 7;

      // Mostrar las evaluaciones de la función
      doc.text(
        `f(xi) = ${funcInput.replace(/x/g, `(${iter.xi})`)} = ${iter.f_xi}`,
        25,
        y
      );
      y += 7;
      doc.text(
        `f(xs) = ${funcInput.replace(/x/g, `(${iter.xs})`)} = ${iter.f_xs}`,
        25,
        y
      );
      y += 7;
      doc.text(
        `f(xr) = ${funcInput.replace(/x/g, `(${iter.xr})`)} = ${iter.f_xr}`,
        25,
        y
      );
      y += 7;

      // Mostrar en qué intervalo está la raíz
      if (i < iteraciones.length - 1) {
        // No mostrar para la última iteración
        doc.text(
          `La raíz se encuentra en el intervalo ${iteraciones[i].intervalo} porque f(xi)*f(xr) < 0`,
          25,
          y
        );
        y += 7;
        doc.text(`${iteraciones[i].nuevoIntervalo}`, 25, y);
        y += 7;
      }

      doc.text(`Error = ${iter.error}%`, 25, y);
      y += 12;
    }

    // Resultado final
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Resultado:", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Raíz = ${raiz}`, 20, 35);
    doc.text(
      `f(${raiz}) = ${funcInput.replace(/x/g, `(${raiz})`)} = ${f_raiz}`,
      20,
      45
    );

    // Tabla de resultados
    doc.text("Tabla de resultados:", 20, 60);

    // Convertir datos para la tabla
    const tableData = iteraciones.map((iter) => [
      iter.iter,
      iter.xi,
      iter.xs,
      iter.xr,
      iter.f_xi,
      iter.f_xs,
      iter.f_xr,
      iter.error,
    ]);

    // Crear tabla
    if (typeof doc.autoTable === "function") {
      doc.autoTable({
        startY: 65,
        head: [
          ["Iter", "xi", "xs", "xr", "f(xi)", "f(xs)", "f(xr)", "Error (%)"],
        ],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [66, 135, 245] },
      });
    } else {
      // Si autoTable no está disponible, mostrar un mensaje
      doc.text(
        "Error: La biblioteca jspdf-autotable no está disponible.",
        20,
        65
      );
    }

    // Guardar el PDF
    doc.save("Metodo_Regla_Falsa.pdf");
  }
}
