import './App.css';
import axios from 'axios';
import { useEffect, useState, useRef } from 'react';
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponent from 'react-plotly.js/factory';
import { Document, Page, Text, View, PDFViewer, Image, Font } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';

const Plot = createPlotlyComponent(Plotly);

function App() {
  const [ecuation, setEcuation] = useState('');
  const [ecuationType, setEcuationType] = useState(0);
  const [error, setError] = useState('');
  const [seeGraph, setSeeGraph] = useState(false);
  const [dataG, setDataG] = useState(null);
  const [decimales, setDecimales] = useState('')
  const [showPDF, setShowPDF] = useState(false);
  const [results, setResults] = useState('')
  const [precision, setPresicion] = useState(null)
  const [url, setUrl] = useState(null)


  const captureChartImage = async () => {
    const chartContainer = document.getElementById('chart-container');
    html2canvas(chartContainer).then(function (canvas) {
      const chartImageURL = canvas.toDataURL('image/png');
      setUrl(chartImageURL)
    });
  }


  const onFormSubmited = async (e) => {
    e.preventDefault();
    let isValid = esFuncionMatematica(ecuation);
    if (!isValid) {
      setError('La ecuación es invalida');
      return
    }
    setError('')
    try {
      if (isNaN(parseFloat(decimales)) || (parseFloat(decimales) < 0.000001 || parseFloat(decimales) > 1)) {
        setError("Debe ser un decimal entre 0.000001 y 1")
        return
      }
      let typeOfEcuantion = parseInt(ecuationType)
      let apiRoute = '';
      switch (typeOfEcuantion) {
        case 0:
          apiRoute = 'http://127.0.0.1:5000/getEcuation0';
          break;
        case 1:
          apiRoute = 'http://127.0.0.1:5000/getEcuation1';
          break;
        case 2:
          apiRoute = 'http://127.0.0.1:5000/getEcuation2';
          break
        case 3:
          apiRoute = 'http://127.0.0.1:5000/Steffensen'
          break
        case 4:
          apiRoute = 'http://127.0.0.1:5000/SteffensenVariasSoluciones'
          break
        default:
          apiRoute = 'http://127.0.0.1:5000/getEcuation0';
          break;
      }
      let result = await axios.post(apiRoute, {
        ecuation,
        ecuationType,
        decimales
      })
      if (result.data.result === undefined && result.data.soluciones === undefined) {
        setError('El resultado no fue encontrado.')
        return
      }


      setSeeGraph(true);
      const puntosEspecificos = []
      if (result.data.result) {
        puntosEspecificos.push({
          x: result.data.result, y: 0
        })
      } else {
        result.data.soluciones.forEach(element => {
          puntosEspecificos.push({
            x: element, y: 0
          })
        });
      }

      const funcion = x => {
        let numberExpressions = ecuation.split(/[\+\-]/);

        let ecuacion_texto_con_valor = ecuation.toLocaleLowerCase().replace("x", "*" + x.toString())
        for (let exp of numberExpressions) {
          ecuacion_texto_con_valor = ecuacion_texto_con_valor.replace(/(-?\d+)\*\*([\d]+)/g, "Math.pow($1, $2)");
          ecuacion_texto_con_valor = ecuacion_texto_con_valor.replace("x", "*" + x.toString());
        }
        let result = eval(ecuacion_texto_con_valor);
        return result
      }

      const puntosFuncion = [];
      for (let x = -100; x <= 100; x++) {
        const y = funcion(x);
        puntosFuncion.push({ x, y });
      }

      const data = [
        {
          type: 'scatter',
          mode: 'lines',
          x: puntosFuncion.map(punto => punto.x),
          y: puntosFuncion.map(punto => punto.y),
          name: 'Función f(x)',
        },
        {
          type: 'scatter',
          mode: 'markers',
          x: puntosEspecificos.map(punto => punto.x),
          y: puntosEspecificos.map(punto => punto.y),
          name: 'Puntos Específicos',
          marker: { size: 8 },
        },
      ];

      setDataG(data)

      if (result.data.result) {
        setError('El resultado fue encontrado en ' + result.data.iterations + ' iteraciones y el resultado es: ' + result.data.result + '')
        setResults(result.data.result)
        setPresicion(result.data.iterations)
      } else {
        setError('Los resultados son: ' + result.data.soluciones.join(", ") + '')
        setResults(result.data.soluciones.join(", "))
      }

    } catch (err) {
      console.log('Something went wrong:', err);
    } finally {
      setTimeout(() => {
        captureChartImage()
      }, 1000);
    }
  }
  const esFuncionMatematica = (str) => {
    const regex = /^([+\-]?(?:\d+\.?\d*x(?:\*\*\d+)?)?|\d+)([+\-]([+\-]?(?:\d+\.?\d*x(?:\*\*\d+)?)?|\d+))*$/;
    return regex.test(str);
  }


  const handleChangeOfEcuation = (event) => {
    setEcuation(event.target.value)
  }

  const handleChangeOfEcuationType = (event) => {
    setEcuationType(event.target.value)
  }

  const handleChangeDecimales = (e) => {
    const inputValue = e.target.value
    setDecimales(inputValue)
  }
  const generatePDFReport = () => {
    setShowPDF(true);
  };

  return (
    <div className="App">
      <div className='container'>
        <div className='row'>
          <h1 className='text-center'>Parcial metodos numericos</h1>
        </div>
        <form onSubmit={onFormSubmited}>
          <div className='row my-3'>
            <div className='col'>
              <div className="input-group">
                <span className="input-group-text">Ecuación:</span>
                <textarea className="form-control" aria-label="Ecuación" value={ecuation} onChange={handleChangeOfEcuation}></textarea>
              </div>
            </div>
            <div className='col'>
              <select className="form-select" aria-label="Default select example" placeholder='Forma de resolver la ecuación:' value={ecuationType} onChange={handleChangeOfEcuationType}>
                <option value={0}>Tanteo</option>
                <option value={1}>Bisección</option>
                <option value={2}>Regla falsa</option>
                <option value={3}>Steffensen</option>
                <option value={4}>Steffensen varias opciones</option>
              </select>
            </div>
            <div className='col'>
              <div className="form-group">
                <label htmlFor="decimalInput">Decimal entre 0.000001 y 1:</label>
                <input
                  type="text"
                  className="form-control"
                  id="decimalInput"
                  value={decimales}
                  onChange={handleChangeDecimales}
                />
              </div>
            </div>
          </div>
          <div className='row my-3 text-center red'>
            <p>
              {error}
            </p>
          </div>
          <div className='row my-5'>
            <button type="submit" className="btn btn-primary">Enviar</button>
          </div>
        </form>

        {seeGraph ? (
          <div className='row'>
            <div className='col'>
              <div id="chart-container">
                <Plot
                  data={dataG}
                  layout={{
                    width: 1000,
                    title: 'Gráfico de la Función y Puntos',
                    xaxis: {
                      title: 'Eje X',
                    },
                    yaxis: {
                      title: 'Eje Y',
                    },
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {showPDF && url ? (
          <div className='row'>
            <div className='col'>
              <PDFViewer width={800} height={600}>
                <PDFReport ecuation={ecuation} dataG={dataG} results={results} precision={precision} url={url} />
              </PDFViewer>
            </div>
          </div>
        ) : null}
        {url && (
          <div className='row my-5'>
            <button type="submit" className="btn btn-primary" onClick={generatePDFReport}>
              Generar Informe en PDF
            </button>
          </div>
        )}


        <div>
          <label><strong>NOTA: La x no puede ir sola por cuestiones tecnicas, si deseas esto debes poner un 1 antes de esta "1x", para elevar al cuadrado se usa "**", todo va sin espacios</strong></label>
          <label>Ingresar la ecuación: En el primer campo, ingresa la ecuación que deseas resolver. La ecuación debe estar en un formato válido y puede incluir la variable "x". Asegúrate de que la ecuación sea matemáticamente correcta.

            Seleccionar el método numérico: En el segundo campo, selecciona el método numérico que deseas utilizar para resolver la ecuación. Puedes elegir entre varios métodos, como Tanteo, Bisección, Regla falsa, Steffensen y Steffensen con varias soluciones.

            Ajustar el valor de decimales: En el tercer campo, ingresa un valor decimal entre 0.000001 y 1. Este valor se utiliza como parte del proceso de resolución de la ecuación.

            Enviar la ecuación: Después de ingresar la ecuación, seleccionar el método numérico y ajustar el valor de decimales, haz clic en el botón "Enviar".

            Ver los resultados: La aplicación realizará cálculos y mostrará los resultados en forma de puntos en un gráfico de la función. Si se encuentra una solución, se mostrará el resultado junto con el número de iteraciones. Si hay varias soluciones, se mostrarán todas.
          </label>

          <label><strong>Ejemplos:</strong></label>
          <br></br>
          <label><strong>
            - 2x**2-5x+2
          </strong></label>
          <br></br>
          <label><strong>
            - 1x**2+8
          </strong></label>
        </div>

      </div>

    </div>
  );
}

export default App;

const PDFReport = ({ ecuation, dataG, results, precision, url }) => {
  return (
    <Document>
      <Page size="A4">
        <View>
          <Text>Ecuación: {ecuation}</Text>
          <Text>Precisión: {precision}</Text>
          <Text>Resultado: {results}</Text>
          {precision && (
            <Text>Iteraciones: {precision}</Text>
          )}
          <Image href={url} />

        </View>
      </Page>
    </Document>
  );
};
