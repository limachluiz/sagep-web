import type { FederativeUnit } from "@/features/projects/projects.types"

export type AtaRegion = {
  number: number
  name: string
  localities: Array<{ cityName: string; stateUf: FederativeUnit }>
}

export const ATA_REGIONS: AtaRegion[] = [
  { number: 1, name: "Região 1", localities: [{ cityName: "Manaus", stateUf: "AM" }] },
  { number: 2, name: "Região 2", localities: [
    { cityName: "Iranduba", stateUf: "AM" }, { cityName: "Manacapuru", stateUf: "AM" },
    { cityName: "Rio Preto da Eva", stateUf: "AM" }, { cityName: "Novo Airão", stateUf: "AM" },
    { cityName: "Anamã", stateUf: "AM" }, { cityName: "Anori", stateUf: "AM" },
  ] },
  { number: 3, name: "Região 3", localities: [
    { cityName: "Coari", stateUf: "AM" }, { cityName: "Tefé", stateUf: "AM" },
    { cityName: "Alvarães", stateUf: "AM" }, { cityName: "Codajás", stateUf: "AM" },
    { cityName: "Manaquiri", stateUf: "AM" }, { cityName: "Careiro", stateUf: "AM" },
    { cityName: "Careiro da Várzea", stateUf: "AM" },
  ] },
  { number: 4, name: "Região 4", localities: [
    { cityName: "Tonantins", stateUf: "AM" }, { cityName: "Tabatinga", stateUf: "AM" },
  ] },
  { number: 5, name: "Região 5", localities: [
    { cityName: "Porto Velho", stateUf: "RO" }, { cityName: "Guajará-Mirim", stateUf: "RO" },
    { cityName: "Humaitá", stateUf: "AM" }, { cityName: "Rio Branco", stateUf: "AC" },
    { cityName: "Cruzeiro do Sul", stateUf: "AC" },
  ] },
  { number: 6, name: "Região 6", localities: [
    { cityName: "São Gabriel da Cachoeira", stateUf: "AM" }, { cityName: "Barcelos", stateUf: "AM" },
  ] },
  { number: 7, name: "Região 7", localities: [
    { cityName: "Boa Vista", stateUf: "RR" }, { cityName: "Bonfim", stateUf: "RR" },
    { cityName: "Pacaraima", stateUf: "RR" }, { cityName: "Normandia", stateUf: "RR" },
  ] },
]
