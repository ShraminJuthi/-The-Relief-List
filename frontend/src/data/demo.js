export const sources = [
  { id: 'union', name: 'Union Council', short: 'UC', color: 'blue' },
  { id: 'survey', name: 'Own Survey', short: 'OS', color: 'green' },
  { id: 'partner', name: 'Partner Organisation', short: 'PO', color: 'purple' },
]

export const initialRecords = [
  { id: 'R-1001', source: 'Union Council', name: 'Md. Abdul Karim', age: 45, address: 'Char Para', family: 4, relative: 'Rahima' },
  { id: 'R-1002', source: 'Own Survey', name: 'Abdul Karim Mia', age: 47, address: 'Chanpara', family: 5, relative: 'Rahima' },
  { id: 'R-1003', source: 'Partner Organisation', name: 'A. Karim', age: null, address: 'Char Para', family: null, relative: 'Rahima' },
  { id: 'R-1004', source: 'Union Council', name: 'Rahim Uddin', age: 52, address: 'South Para', family: 6, relative: 'Ayesha' },
  { id: 'R-1005', source: 'Own Survey', name: 'Rahimuddin', age: 52, address: 'South Para', family: 6, relative: 'Ayesha' },
  { id: 'R-1006', source: 'Partner Organisation', name: 'Abdul Karim', age: 39, address: 'North Para', family: 3, relative: 'Salma' },
  { id: 'R-1007', source: 'Own Survey', name: 'Salma Begum', age: 33, address: 'East Char', family: 4, relative: 'Jamal' },
]

export const initialMatches = [
  { id: 'M-001', a: 'R-1001', b: 'R-1003', score: 86, status: 'pending', reasons: ['Names are similar', 'Both records list Char Para', 'Relative name matches: Rahima'], caution: 'Age is missing in the partner record.' },
  { id: 'M-002', a: 'R-1001', b: 'R-1002', score: 72, status: 'pending', reasons: ['Names are similar', 'Ages differ by 2 years', 'Addresses are similar but not identical'], caution: 'The address differs. Confirm using local knowledge before deciding.' },
  { id: 'M-003', a: 'R-1004', b: 'R-1005', score: 94, status: 'pending', reasons: ['Names are very similar', 'Age is identical', 'Address and family size match'], caution: 'A high score is still not proof of identity.' },
  { id: 'M-004', a: 'R-1001', b: 'R-1006', score: 48, status: 'pending', reasons: ['Name is similar'], caution: 'Addresses and ages differ. These may be two different people.' },
]

export const loadState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('relief-list-state'))
    if (saved) return saved
  } catch {}
  return { records: initialRecords, matches: initialMatches, imported: [] }
}
export const saveState = state => localStorage.setItem('relief-list-state', JSON.stringify(state))
