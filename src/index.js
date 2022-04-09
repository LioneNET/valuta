import axios from "axios";
import dateFormat from "dateformat";
import './css/style.css';


const $root = document.querySelector('#root-app')
const $main = document.createElement('div')
let prevValute = []
$main.className = 'main'
$root.append($main)

const templateLoading = () => {
  const $body = document.createElement('div')
  $body.className = 'modal-placeholder'
  $body.innerHTML = `
    <div class="loading-text">
      Загружаем...
    </div>
  `
  return {
    show() {
      document.body.appendChild($body)
    },
    close() {
      $body.remove()
    }
  }
}

const percent = (today, yesterday) => {
  return ((today - yesterday) / today * 100).toFixed(2)
}

const fetchLastDayDatas = async () => {
  const dates = []
  let next = null
  const loading = templateLoading()
  
  if (prevValute.length) {
    return prevValute
  }

  loading.show()
  for (let i = 0; i < 10; i++) {
    try {
      const response = await axios(next === null ? `https://www.cbr-xml-daily.ru/daily_json.js` : next)
      next = response.data.PreviousURL
      dates.push({ ...response.data })
    } catch {
      console.error('error')
    }
  }
  loading.close()
  prevValute = [...dates]
  return dates
}

const templateTooltip = () => {
  const $body = document.createElement('div')
  $body.className = 'tooltip'
  $body.innerHTML = `<div class='text'></div>`
  const $text = $body.querySelector('.text')
  return {
    node: $body,
    remove: () => $body.remove(),
    show: text => {
      $text.innerText = text
      document.body.appendChild($body)
    },
    pos: (x, y) => {
      const wdithCenter = $body.offsetWidth / 2
      $body.style.left = `${x - wdithCenter}px`
      $body.style.top = `${y + 20}px`
    }
  }
}

const templatePreviousList = (data) => {
  const $body = document.createElement('div')
  $body.className = 'valute-list'
  $body.innerHTML = `
    ${data.Valute.map(item => {
    const val = percent(item.today, item.yesterday)
    return (`
      <div class='valute-block'>
        <span>${dateFormat(item.date, 'dd.mm.yyyy')}</span>
        <span>${item.today} руб</span>
        <span class="per ${val > 0 ? `positive` : `negative`}">${val}%</span>
      </div>`)
  }).join('')}`
  return $body
}

const templateModal = () => {
  const $body = document.createElement('div')
  $body.className = 'modal-placeholder'
  $body.innerHTML = `
    <div class="modal-place">
      <div class="modal-title"></div>
      <div class="modal-body"></div>
      <div class="modal-footer">
        <button class="btn close">Закрыть</button>
      </div>
    </div>
  `
  const $content = $body.querySelector('.modal-body')
  $body.querySelector('.close').addEventListener('click', () => $body.remove())
  return {
    setTitle(title) {
      $body.querySelector('.modal-title').innerText = title
    },
    show($node) {
      $content.appendChild($node)
      document.body.appendChild($body)
    },
    close() {
      $body.remove()
    }
  }
}

const loadLastDaysValutes = async el => {
  const modal = templateModal()
  const target = el.target.closest('tr')
  if (target?.dataset.valute) {
    const valute = target.dataset.valute
    const valuteData = await fetchLastDayDatas()
    const selectedValute = valuteData.map(item => {
      return {
        date: item.Date,
        today: item.Valute[valute].Value,
        yesterday: item.Valute[valute].Previous
      }
    })
    modal.setTitle(target.dataset.valuteName)
    modal.show(templatePreviousList({
      Name: target.dataset.valuteName,
      Valute: selectedValute
    }))
  }
}

const tableTemplate = (Valute, Date) => {
  const $body = document.createElement('div')
  const $table = document.createElement('table')
  const tooltip = templateTooltip()
  $body.className = 'valutes'
  $body.innerHTML = `
    <div class="course_today">Курс валют на: ${dateFormat(Date, 'dd.mm.yyyy')}</div>
  `;
  $table.innerHTML = `
    <tr>
      <th>Код валюты</th>
      <th>Значение в рублях</th>
      <th>% за предыдущий день</th>
    </tr>
    ${Object.keys(Valute).map(item => {
    const val = percent(Valute[item].Value, Valute[item].Previous)
    return (
      `
        <tr data-valute-name="${Valute[item].Name}" data-valute="${item}" >
          <td>${item}</td>
          <td>${Valute[item].Value}</td>
          <td class="${val > 0 ? `positive` : `negative`}">${val}%</td>
        </tr>
        `
    )
  }).join('')}
  `;

  $body.appendChild($table)
  $table.addEventListener('mouseover', el => {
    el.preventDefault();
    const target = el.target.closest('tr')
    if (target?.dataset.valuteName) {
      tooltip.show(target.dataset.valuteName)
    }
  })
  $table.addEventListener('mouseleave', () => {
    tooltip.remove()
  })
  $table.addEventListener('mousemove', el => {
    const x = el.clientX
    const y = el.clientY
    tooltip.pos(x, y)
  })
  $table.addEventListener('click', loadLastDaysValutes)
  return $body
}

const render = async ($node) => {
  try {
    const res1 = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js')
    const { Valute, Date } = res1.data
    $main.appendChild(tableTemplate(Valute, Date))
  } catch {
    console.log('Ошибка загрузки')
  }
}

render($main)
