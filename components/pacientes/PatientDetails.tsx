"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Patient } from "@/types/pacientes";
import { 
  User, Calendar, Phone, Mail, MapPin, FileText,
  Printer, Download, Loader2, ChevronRight
} from "lucide-react";

interface PatientDetailsProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientDetails({ patientId, isOpen, onClose }: PatientDetailsProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Formatear fecha para mostrar
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!patientId || !isOpen) return;
      
      setLoading(true);
      
      try {
        // Obtener datos del paciente
        const { data: patientData, error: patientError } = await supabase
          .from("pacientes")
          .select("*")
          .eq("id", patientId)
          .single();
        
        if (patientError) throw patientError;
        
        if (patientData) {
          setPatient(patientData);
        }
      } catch (error) {
        console.error("Error al cargar detalles del paciente:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles del paciente",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [patientId, isOpen, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader className="pb-4 mb-2 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">
              Detalles del Paciente
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Descargar</span>
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : patient ? (
          <div className="space-y-6">
            {/* Información personal */}
            <Card className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2 bg-muted/30">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {patient.primer_nombre.charAt(0)}{patient.primer_apellido.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {patient.primer_nombre} {patient.primer_apellido} {patient.segundo_apellido || ''}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {patient.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      
                      {patient.fecha_nacimiento && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">Fecha de Nacimiento:</span>
                            <p>{formatDate(patient.fecha_nacimiento)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">Teléfono:</span>
                          <p>{patient.telefono}</p>
                        </div>
                      </div>
                      
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">Email:</span>
                            <p>{patient.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {patient.direccion && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="font-medium">Dirección:</span>
                            <p>{patient.direccion}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Notas adicionales */}
            {patient.notas && (
              <Card className="overflow-hidden border-border/50 hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2 bg-muted/30">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Notas Adicionales
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-sm whitespace-pre-line">{patient.notas}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Información de registro */}
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Fecha de registro: {formatDate(patient.created_at)}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover:bg-muted" onClick={onClose}>
                Cerrar
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No se encontró información del paciente</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}